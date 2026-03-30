import { createClient } from "@supabase/supabase-js";
import { mapIndustry } from "./helpers/mapIndustry.js";

// ── Config ──
const SUPABASE_URL = "https://awhqwqhntgxjvvawzkog.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!SERVICE_ROLE_KEY || !ANTHROPIC_KEY || !RAPIDAPI_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, and RAPIDAPI_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── CLI args ──
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const LIMIT = parseInt(getFlag("--limit", "100"), 10);
const BOARD_FILTER = getFlag("--board", "all").toLowerCase();

// ── 100+ job titles spanning the full American workforce ──
const JOB_TITLES = [
  // Software & IT
  "software engineer", "web developer", "web designer", "frontend developer",
  "backend developer", "full stack developer", "mobile app developer",
  "data analyst", "data scientist", "data engineer", "database administrator",
  "cybersecurity analyst", "network engineer", "IT support specialist",
  "systems administrator", "cloud engineer", "DevOps engineer", "QA tester",
  "technical writer", "scrum master", "product manager",
  // Engineering (non-software)
  "mechanical engineer", "civil engineer", "electrical engineer",
  "chemical engineer", "industrial engineer", "biomedical engineer",
  "structural engineer", "environmental engineer", "aerospace engineer",
  // Healthcare — clinical
  "registered nurse", "licensed practical nurse", "nurse practitioner",
  "physician assistant", "medical assistant", "dental hygienist", "dentist",
  "pharmacy technician", "pharmacist", "physical therapist",
  "occupational therapist", "speech language pathologist", "radiologic technologist",
  "home health aide", "EMT", "paramedic", "surgical technologist",
  "medical laboratory technician", "optometrist",
  // Healthcare — admin & pharma
  "medical billing specialist", "health information technician",
  "clinical research coordinator", "pharma sales representative",
  "pharma marketing manager", "regulatory affairs specialist",
  "medical science liaison", "hospital administrator",
  // Trades & Skilled Labor
  "electrician", "plumber", "HVAC technician", "welder", "carpenter",
  "diesel mechanic", "auto mechanic", "construction foreman",
  "heavy equipment operator", "ironworker", "pipefitter", "roofer",
  "elevator technician", "locksmith", "machinist", "CNC operator",
  // Manufacturing & Warehousing
  "machine operator", "quality inspector", "warehouse associate",
  "forklift operator", "production supervisor", "assembly line worker",
  "plant manager", "safety coordinator",
  // Transportation & Logistics
  "CDL truck driver", "delivery driver", "dispatcher",
  "supply chain coordinator", "logistics analyst", "freight broker",
  "airline pilot", "bus driver", "train conductor",
  // Finance, Banking & Insurance
  "accountant", "financial analyst", "loan officer", "bank teller",
  "mortgage underwriter", "claims adjuster", "actuary",
  "investment analyst", "tax preparer", "auditor", "bookkeeper",
  "financial advisor", "credit analyst",
  // Marketing, Advertising & Sales
  "marketing manager", "digital marketing specialist", "SEO specialist",
  "social media manager", "sales representative", "account executive",
  "real estate agent", "media buyer", "brand manager",
  "business development representative", "copywriter",
  // Education — K-12
  "elementary school teacher", "high school teacher", "middle school teacher",
  "special education teacher", "school counselor", "school principal",
  "substitute teacher", "ESL teacher", "paraprofessional",
  // Education — Higher Ed
  "university professor", "adjunct professor", "academic advisor",
  "admissions counselor", "research assistant", "financial aid counselor",
  // Admin & Office
  "administrative assistant", "executive assistant", "receptionist",
  "office manager", "data entry clerk", "virtual assistant",
  "human resources generalist", "HR recruiter", "payroll specialist",
  "operations manager", "project coordinator",
  // Government & Public Service
  "police officer", "firefighter", "corrections officer",
  "social worker", "probation officer", "city planner",
  "public health analyst", "park ranger", "mail carrier",
  // Legal
  "paralegal", "legal assistant", "court clerk", "attorney",
  "legal secretary", "compliance officer",
  // Hospitality, Food Service & Tourism
  "hotel front desk manager", "restaurant general manager", "executive chef",
  "line cook", "bartender", "event planner", "travel agent",
  "housekeeper", "concierge",
  // Retail & Customer Service
  "store manager", "retail associate", "loss prevention specialist",
  "customer service representative", "call center agent", "visual merchandiser",
  // Creative, Media & Design
  "graphic designer", "UX designer", "UI designer", "video editor",
  "photographer", "interior designer", "content creator",
  "motion graphics designer", "art director", "animator",
  // Journalism & Communications
  "journalist", "public relations specialist", "communications director",
  "technical editor", "broadcast reporter",
  // Agriculture, Forestry & Environment
  "farm manager", "agricultural inspector", "environmental scientist",
  "veterinary technician", "landscape architect", "conservation officer",
  // Nonprofit & Social Services
  "grant writer", "program coordinator", "fundraiser",
  "community outreach coordinator", "case manager",
  // Science & Research
  "research scientist", "laboratory technician", "clinical trial manager",
  "geologist", "chemist", "microbiologist",
  // Fitness, Wellness & Beauty
  "personal trainer", "physical therapy assistant", "massage therapist",
  "cosmetologist", "esthetician",
];

// ── 50 cities covering all US regions, mix of metros, mid-size, and smaller markets ──
const CITIES = [
  // Northeast — major + mid-size
  "New York, NY", "Boston, MA", "Philadelphia, PA", "Burlington, VT",
  "Portland, ME", "Providence, RI", "Hartford, CT", "Syracuse, NY",
  // Southeast — Sun Belt + state capitals
  "Atlanta, GA", "Charlotte, NC", "Nashville, TN", "Jacksonville, FL",
  "Richmond, VA", "Charleston, SC", "Huntsville, AL", "Savannah, GA",
  "Raleigh, NC", "Lexington, KY",
  // Midwest — major + college towns + rural-adjacent
  "Chicago, IL", "Minneapolis, MN", "Columbus, OH", "Indianapolis, IN",
  "Des Moines, IA", "Madison, WI", "Omaha, NE", "Fargo, ND",
  "Sioux Falls, SD", "Grand Rapids, MI",
  // South Central — growth cities + underrepresented
  "Dallas, TX", "San Antonio, TX", "Oklahoma City, OK", "Little Rock, AR",
  "New Orleans, LA", "Memphis, TN", "Tulsa, OK",
  // Mountain West
  "Denver, CO", "Salt Lake City, UT", "Boise, ID", "Billings, MT",
  "Cheyenne, WY", "Albuquerque, NM",
  // Southwest
  "Phoenix, AZ", "Tucson, AZ", "Las Vegas, NV", "El Paso, TX",
  // West Coast + Pacific
  "Seattle, WA", "Portland, OR", "Sacramento, CA", "Fresno, CA",
  "Anchorage, AK", "Honolulu, HI",
];

// ── Build randomized query pairs ──
function buildRandomQueries(count) {
  const pairs = [];
  const usedCombos = new Set();
  while (pairs.length < count) {
    const title = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const key = `${title}|${city}`;
    if (usedCombos.has(key)) continue;
    usedCombos.add(key);
    pairs.push({ query: title, location: city });
  }
  return pairs;
}

// ── Extract a field with fallback chains for JSearch response variations ──
function extractField(job, ...keys) {
  for (const key of keys) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let val = job;
      for (const p of parts) {
        val = val?.[p];
      }
      if (val != null && val !== "") return val;
    } else {
      if (job[key] != null && job[key] !== "") return job[key];
    }
  }
  return null;
}

// ── Parse city/state from a location string like "New York, NY" or "Austin, TX, US" ──
function parseLocation(locStr) {
  if (!locStr) return { city: "", state: "" };
  const parts = locStr.split(",").map((s) => s.trim());
  return {
    city: parts[0] || "",
    state: parts[1] || "",
  };
}

// ── Fetch listings from JSearch ──
let _jsearchLogged = false;
async function fetchListings(query, location, numPages) {
  const params = new URLSearchParams({
    query: `${query} in ${location}`,
    page: "1",
    num_pages: String(numPages),
    date_posted: "month",
  });

  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JSearch ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  // Debug: dump full first raw listing to see actual field names
  if (json.data?.[0] && !_jsearchLogged) {
    _jsearchLogged = true;
    console.log("\n  ═══ [DEBUG] RAW JSearch first listing ═══");
    console.log(JSON.stringify(json.data[0], null, 2));
    console.log("  ═══ [END DEBUG] ═══\n");
  }

  return (json.data || []).map((job) => {
    // Location fallback: direct fields → job_location string → empty
    let city = extractField(job, "job_city", "city", "job_location.city") || "";
    let state = extractField(job, "job_state", "state", "job_location.state") || "";

    // If city/state still empty, try parsing from location string fields
    if (!city || !state) {
      const locStr = extractField(job, "job_location", "location") || "";
      if (locStr && typeof locStr === "string") {
        const parsed = parseLocation(locStr);
        if (!city) city = parsed.city;
        if (!state) state = parsed.state;
      }
    }

    return {
      title:
        extractField(job, "job_title", "job_job_title") || "Unknown",
      company:
        extractField(job, "employer_name", "company_name", "employer.name") ||
        "Unknown",
      job_board:
        extractField(job, "job_publisher", "source", "via") || "Unknown",
      description:
        extractField(job, "job_description", "description") || "",
      posted:
        extractField(
          job,
          "job_posted_at_datetime_utc",
          "job_posted_at",
          "posted_at",
          "job_date_posted"
        ) || null,
      city,
      state,
    };
  });
}

// ── Score a listing with Claude ──
let _claudeLogged = false;
async function scoreWithClaude(listing) {
  const descSnippet = listing.description.slice(0, 3000);

  // Skip listings with no meaningful description
  if (descSnippet.length < 50) {
    return {
      ghost_score: 85,
      pattern_flags: ["no job description provided", "likely ghost listing"],
    };
  }

  const prompt = `You are a ghost job detection system. Analyze this job listing and determine how likely it is to be a "ghost job" — a listing that is fake, already filled, posted for compliance reasons, or not genuinely open.

Job Title: ${listing.title}
Company: ${listing.company}
Job Board: ${listing.job_board}
Posted: ${listing.posted || "Unknown"}
Description:
${descSnippet}

You MUST return a JSON object with exactly these two keys and nothing else:
{
  "ghost_score": <integer 0-100, where 0 = definitely real and 100 = definitely ghost>,
  "pattern_flags": ["flag1", "flag2", "flag3"]
}

pattern_flags must be an array of 2-5 short strings explaining what signals you detected (e.g. "vague requirements", "no salary info", "reposted frequently", "generic description", "specific tech stack listed", "legitimate detailed posting").

Return ONLY the JSON object. No markdown, no explanation, no code fences.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = (data.content?.[0]?.text || "").trim();

  // Debug: dump full first Claude response
  if (!_claudeLogged) {
    _claudeLogged = true;
    console.log("  ═══ [DEBUG] RAW Claude response ═══");
    console.log(raw);
    console.log("  ═══ [END DEBUG] ═══\n");
  }

  // Extract JSON from response (handle markdown code fences if present)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch)
    throw new Error(`No JSON in Claude response: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(jsonMatch[0]);

  // Robust extraction of ghost_score
  const score = parseInt(parsed.ghost_score ?? parsed.score ?? 0, 10);

  // Robust extraction of pattern_flags — handle every possible shape
  let flags;
  const rawFlags = parsed.pattern_flags ?? parsed.flags ?? parsed.patterns;
  if (Array.isArray(rawFlags)) {
    flags = rawFlags.map(String);
  } else if (typeof rawFlags === "string") {
    // Could be comma-separated or a single flag
    flags = rawFlags.includes(",")
      ? rawFlags.split(",").map((s) => s.trim())
      : [rawFlags];
  } else {
    flags = ["unable to parse flags"];
  }

  return { ghost_score: score, pattern_flags: flags };
}

// ── Calculate posting age ──
function postingAgeDays(postedAt) {
  if (!postedAt) return null;
  const diff = Date.now() - new Date(postedAt).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

// ── Main ──
async function main() {
  console.log(
    `\n  GhostBust Batch Scanner — limit: ${LIMIT}, board: ${BOARD_FILTER}\n`
  );

  // Build more queries than needed — we want diversity, not volume per query
  // For --limit 5 we want at least 5 different queries (1 listing each)
  // For --limit 100 we want ~50 queries (2 listings each)
  const queryCount = Math.min(
    Math.max(LIMIT, 10), // at least 10 queries, or as many as LIMIT
    JOB_TITLES.length * CITIES.length
  );
  const queries = buildRandomQueries(queryCount);

  // Gather listings — take only 1-2 per query for max diversity
  let allListings = [];
  const maxPerQuery = LIMIT <= 20 ? 1 : 2;
  const numPages = 1;

  for (const q of queries) {
    if (allListings.length >= LIMIT) break;
    try {
      const listings = await fetchListings(q.query, q.location, numPages);
      // Take only maxPerQuery from each to force rotation
      const take = listings.slice(0, maxPerQuery);
      allListings.push(...take);
      console.log(
        `  Fetched ${take.length} of ${listings.length} for "${q.query}" in ${q.location}`
      );
    } catch (err) {
      console.error(
        `  ! Failed "${q.query}" in ${q.location}: ${err.message}`
      );
    }
    // Small delay between JSearch calls too
    await new Promise((r) => setTimeout(r, 200));
  }

  // Filter out listings with no title
  allListings = allListings.filter(
    (l) => l.title && l.title !== "Unknown"
  );

  // Apply board filter
  if (BOARD_FILTER !== "all") {
    allListings = allListings.filter((l) =>
      l.job_board.toLowerCase().includes(BOARD_FILTER)
    );
  }

  // Trim to limit
  allListings = allListings.slice(0, LIMIT);
  console.log(`\n  Total listings to scan: ${allListings.length}\n`);

  if (allListings.length === 0) {
    console.log("No listings found. Exiting.");
    return;
  }

  let scanned = 0;
  let inserted = 0;
  let errors = 0;

  for (const listing of allListings) {
    scanned++;
    try {
      if (!listing.title || listing.title.trim() === "") {
        console.log(`  Skipped: no job_title`);
        continue;
      }

      const { ghost_score, pattern_flags } = await scoreWithClaude(listing);

      // Use original ghost_scans column names: title, signal_flags (not job_title, pattern_flags)
      const row = {
        title: listing.title || null,
        company: listing.company || null,
        job_board: listing.job_board || null,
        ghost_score,
        signal_flags: pattern_flags,
        full_description: (listing.description || "").slice(0, 10000) || null,
        posting_age_days: postingAgeDays(listing.posted),
        initiated_by: "system",
        job_city: listing.city || null,
        job_state: listing.state || null,
        industry: mapIndustry(listing.title) || "Other",
      };

      // Debug: log every insert payload
      console.log(`  ═══ [DEBUG] Insert payload #${scanned} ═══`);
      console.log(
        JSON.stringify(
          { ...row, full_description: `(${(row.full_description || "").length} chars)` },
          null,
          2
        )
      );
      console.log("  ═══ [END DEBUG] ═══");

      const { error } = await supabase.from("ghost_scans").insert(row);

      if (error) {
        console.error(
          `  x DB insert failed for "${listing.title}": ${error.message}`
        );
        errors++;
      } else {
        inserted++;
        console.log(
          `  Scanned ${scanned} / ${allListings.length} — ${listing.title} at ${listing.company} — Score: ${ghost_score} — Flags: ${pattern_flags.join(", ")}`
        );
      }
    } catch (err) {
      console.error(
        `  x Failed "${listing.title}" at ${listing.company}: ${err.message}`
      );
      errors++;
    }

    // 500ms delay between Claude API calls
    if (scanned < allListings.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(
    `\n  Done. Scanned: ${scanned}, Inserted: ${inserted}, Errors: ${errors}\n`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
