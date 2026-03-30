// Vercel cron: runs the batch ghost scanner with --limit 10
// Schedule: 0 3 * * * (3am UTC daily)
// Auth: Vercel injects CRON_SECRET as Authorization: Bearer <secret>

import { createClient } from '@supabase/supabase-js';
import { mapIndustry } from '../../scripts/helpers/mapIndustry.js';

const SUPABASE_URL     = 'https://awhqwqhntgxjvvawzkog.supabase.co';
const LIMIT            = 10;

// ── Job title + city pools (mirrors batchScan.js) ────────────────────────────
const JOB_TITLES = [
  "software engineer", "web developer", "web designer", "frontend developer",
  "backend developer", "full stack developer", "mobile app developer",
  "data analyst", "data scientist", "data engineer", "database administrator",
  "cybersecurity analyst", "network engineer", "IT support specialist",
  "systems administrator", "cloud engineer", "DevOps engineer", "QA tester",
  "technical writer", "scrum master", "product manager",
  "mechanical engineer", "civil engineer", "electrical engineer",
  "chemical engineer", "industrial engineer", "biomedical engineer",
  "registered nurse", "licensed practical nurse", "nurse practitioner",
  "physician assistant", "medical assistant", "dental hygienist", "dentist",
  "pharmacy technician", "pharmacist", "physical therapist",
  "occupational therapist", "radiologic technologist", "home health aide",
  "EMT", "paramedic", "medical billing specialist", "hospital administrator",
  "electrician", "plumber", "HVAC technician", "welder", "carpenter",
  "diesel mechanic", "auto mechanic", "construction foreman",
  "warehouse associate", "forklift operator", "production supervisor",
  "CDL truck driver", "delivery driver", "dispatcher",
  "supply chain coordinator", "logistics analyst", "freight broker",
  "accountant", "financial analyst", "loan officer", "bank teller",
  "claims adjuster", "actuary", "investment analyst", "tax preparer",
  "auditor", "bookkeeper", "financial advisor",
  "marketing manager", "digital marketing specialist", "SEO specialist",
  "social media manager", "sales representative", "account executive",
  "real estate agent", "copywriter", "brand manager",
  "elementary school teacher", "high school teacher", "school counselor",
  "administrative assistant", "executive assistant", "receptionist",
  "office manager", "data entry clerk", "human resources generalist",
  "HR recruiter", "payroll specialist", "operations manager",
  "police officer", "firefighter", "social worker",
  "paralegal", "legal assistant", "court clerk", "attorney",
  "hotel front desk manager", "restaurant general manager", "executive chef",
  "line cook", "bartender", "event planner",
  "store manager", "retail associate", "customer service representative",
  "graphic designer", "UX designer", "UI designer", "video editor",
  "journalist", "public relations specialist",
  "personal trainer", "massage therapist", "cosmetologist",
];

const CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
  "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
  "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL",
  "Atlanta, GA", "Charlotte, NC", "Nashville, TN", "Seattle, WA",
  "Denver, CO", "Boston, MA", "Minneapolis, MN", "Columbus, OH",
  "Indianapolis, IN", "Portland, OR", "Las Vegas, NV", "Memphis, TN",
  "Louisville, KY", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM",
  "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Kansas City, MO",
  "Miami, FL", "Raleigh, NC", "Omaha, NE", "Des Moines, IA",
  "Salt Lake City, UT", "Richmond, VA", "Oklahoma City, OK", "Tampa, FL",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseLocation(locStr) {
  if (!locStr) return { city: '', state: '' };
  const parts = locStr.split(',').map(s => s.trim());
  return { city: parts[0] || '', state: parts[1] || '' };
}

function extractField(job, ...keys) {
  for (const key of keys) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let val = job;
      for (const p of parts) val = val?.[p];
      if (val != null && val !== '') return val;
    } else {
      if (job[key] != null && job[key] !== '') return job[key];
    }
  }
  return null;
}

function postingAgeDays(postedAt) {
  if (!postedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(postedAt).getTime()) / 86400000));
}

// ── JSearch fetch ─────────────────────────────────────────────────────────────
async function fetchListings(query, location, rapidApiKey) {
  const params = new URLSearchParams({
    query: `${query} in ${location}`,
    page: '1',
    num_pages: '1',
    date_posted: 'month',
  });
  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error(`JSearch ${res.status}`);
  const json = await res.json();
  return (json.data || []).map(job => {
    let city  = extractField(job, 'job_city', 'city') || '';
    let state = extractField(job, 'job_state', 'state') || '';
    if (!city || !state) {
      const parsed = parseLocation(extractField(job, 'job_location', 'location') || '');
      if (!city)  city  = parsed.city;
      if (!state) state = parsed.state;
    }
    return {
      title:       extractField(job, 'job_title', 'job_job_title') || 'Unknown',
      company:     extractField(job, 'employer_name', 'company_name') || 'Unknown',
      job_board:   extractField(job, 'job_publisher', 'source', 'via') || 'Unknown',
      description: extractField(job, 'job_description', 'description') || '',
      posted:      extractField(job, 'job_posted_at_datetime_utc', 'job_posted_at', 'posted_at') || null,
      city,
      state,
    };
  });
}

// ── Claude scoring ────────────────────────────────────────────────────────────
async function scoreWithClaude(listing, anthropicKey) {
  const descSnippet = listing.description.slice(0, 3000);
  if (descSnippet.length < 50) {
    return { ghost_score: 85, pattern_flags: ['no job description provided', 'likely ghost listing'] };
  }
  const prompt = `You are a ghost job detection system. Analyze this job listing and determine how likely it is to be a "ghost job" — a listing that is fake, already filled, posted for compliance reasons, or not genuinely open.

Job Title: ${listing.title}
Company: ${listing.company}
Job Board: ${listing.job_board}
Posted: ${listing.posted || 'Unknown'}
Description:
${descSnippet}

You MUST return a JSON object with exactly these two keys and nothing else:
{
  "ghost_score": <integer 0-100, where 0 = definitely real and 100 = definitely ghost>,
  "pattern_flags": ["flag1", "flag2", "flag3"]
}

Return ONLY the JSON object. No markdown, no explanation, no code fences.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data  = await res.json();
  const raw   = (data.content?.[0]?.text || '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in Claude response`);
  const parsed   = JSON.parse(match[0]);
  const score    = parseInt(parsed.ghost_score ?? parsed.score ?? 0, 10);
  const rawFlags = parsed.pattern_flags ?? parsed.flags ?? parsed.patterns;
  let flags;
  if (Array.isArray(rawFlags))       flags = rawFlags.map(String);
  else if (typeof rawFlags === 'string') flags = rawFlags.includes(',') ? rawFlags.split(',').map(s => s.trim()) : [rawFlags];
  else                               flags = ['unable to parse flags'];
  return { ghost_score: score, pattern_flags: flags };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const rapidApiKey  = process.env.RAPIDAPI_KEY;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anthropicKey || !rapidApiKey || !serviceKey) {
    const missing = ['ANTHROPIC_API_KEY', 'RAPIDAPI_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
      .filter(k => !process.env[k]);
    console.error('[scan-cron] Missing env vars:', missing.join(', '));
    return res.status(500).json({ error: 'Missing env vars', missing });
  }

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const log      = { attempted: 0, inserted: 0, skipped: 0, errors: [] };
  const startedAt = new Date().toISOString();

  console.log(`[scan-cron] Starting — limit: ${LIMIT}, time: ${startedAt}`);

  // Build unique query pairs
  const usedCombos = new Set();
  const queries    = [];
  while (queries.length < LIMIT * 3) {
    const title = randomItem(JOB_TITLES);
    const city  = randomItem(CITIES);
    const key   = `${title}|${city}`;
    if (!usedCombos.has(key)) { usedCombos.add(key); queries.push({ title, city }); }
  }

  for (const q of queries) {
    if (log.inserted >= LIMIT) break;

    let listings;
    try {
      listings = await fetchListings(q.title, q.city, rapidApiKey);
    } catch (err) {
      console.warn(`[scan-cron] JSearch failed for "${q.title}" in ${q.city}: ${err.message}`);
      continue;
    }

    const listing = listings[0];
    if (!listing || !listing.title || listing.title.trim() === '' || listing.title === 'Unknown') {
      log.skipped++;
      continue;
    }

    log.attempted++;
    try {
      const { ghost_score, pattern_flags } = await scoreWithClaude(listing, anthropicKey);
      const row = {
        title:            listing.title,
        company:          listing.company || null,
        job_board:        listing.job_board || null,
        ghost_score,
        signal_flags:     pattern_flags,
        full_description: (listing.description || '').slice(0, 10000) || null,
        posting_age_days: postingAgeDays(listing.posted),
        initiated_by:     'system',
        job_city:         listing.city || null,
        job_state:        listing.state || null,
        industry:         mapIndustry(listing.title) || 'Other',
      };
      const { error } = await supabase.from('ghost_scans').insert(row);
      if (error) {
        console.error(`[scan-cron] DB insert failed: ${error.message}`);
        log.errors.push({ title: listing.title, error: error.message });
      } else {
        log.inserted++;
        console.log(`[scan-cron] Inserted [${log.inserted}/${LIMIT}] "${listing.title}" @ ${listing.company} — score: ${ghost_score}`);
      }
    } catch (err) {
      console.error(`[scan-cron] Score/insert failed for "${listing.title}": ${err.message}`);
      log.errors.push({ title: listing.title, error: err.message });
    }

    // Respect rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  const summary = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    limit: LIMIT,
    attempted: log.attempted,
    inserted: log.inserted,
    skipped: log.skipped,
    errors: log.errors.length,
    error_details: log.errors,
  };

  console.log('[scan-cron] Done —', JSON.stringify(summary));
  return res.status(200).json(summary);
}
