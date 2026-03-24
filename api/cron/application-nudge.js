import { applicationNudgeEmail } from '../emails/applicationNudge.js';

const SUPABASE_URL = 'https://awhqwqhntgxjvvawzkog.supabase.co';

// Statuses that are still "open" — terminal statuses (Ghosted, Rejected, Offer) skip the nudge.
const OPEN_STATUSES = ['Researching', 'Saved', 'Applied', 'Interviewing'];

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.RESEND_FROM_EMAIL || 'GhostBust <onboarding@ghostbust.us>';

  if (!serviceKey || !resendKey) {
    return res.status(500).json({ error: 'Missing required environment variables' });
  }

  try {
    // 1. Fetch all stale applications not yet nudged.
    //    "Stale" = open status + updated_at (or created_at) older than 30 days.
    const staleRes = await fetch(
      `${SUPABASE_URL}/rest/v1/applications` +
      `?select=id,user_id,company,title,applied_date,ghost_score,status,updated_at,created_at` +
      `&status=in.(${OPEN_STATUSES.join(',')})` +
      `&not.id=in.(select:application_nudges.application_id)`,
      { headers: sbHeaders(serviceKey) }
    );

    if (!staleRes.ok) throw new Error(`Failed to fetch applications: ${staleRes.status}`);
    let applications = await staleRes.json();

    // Filter by 30-day staleness in JS (simpler than PostgREST date arithmetic).
    const cutoff = Date.now() - 30 * 86_400_000;
    applications = applications.filter(function(app) {
      const lastActivity = new Date(app.updated_at || app.created_at).getTime();
      return lastActivity < cutoff;
    });

    if (applications.length === 0) {
      return res.status(200).json({ sent: 0, skipped: 0, message: 'No stale applications found' });
    }

    // 2. Already-nudged application IDs (secondary check to handle race conditions).
    const nudgedRes = await fetch(
      `${SUPABASE_URL}/rest/v1/application_nudges?select=application_id`,
      { headers: sbHeaders(serviceKey) }
    );
    const nudged = await nudgedRes.json();
    const nudgedSet = new Set(nudged.map(function(r) { return r.application_id; }));
    applications = applications.filter(function(app) { return !nudgedSet.has(app.id); });

    // 3. Group stale applications by user.
    const byUser = {};
    for (const app of applications) {
      if (!byUser[app.user_id]) byUser[app.user_id] = [];
      byUser[app.user_id].push(app);
    }

    // 4. Fetch user emails from Supabase admin API.
    const userIds = Object.keys(byUser);
    const userEmails = await getUserEmails(serviceKey, userIds);

    const results = { sent: 0, skipped: 0, errors: [] };

    // 5. Send one consolidated email per user.
    for (const userId of userIds) {
      const email = userEmails[userId];
      if (!email) { results.skipped++; continue; }

      const apps = byUser[userId];
      const { subject, html } = applicationNudgeEmail(apps);

      try {
        await sendEmail(resendKey, fromEmail, email, subject, html);

        // Record nudge for every application in this send.
        const nudgeRows = apps.map(function(app) {
          return { application_id: app.id, user_id: userId };
        });
        await fetch(`${SUPABASE_URL}/rest/v1/application_nudges`, {
          method: 'POST',
          headers: { ...sbHeaders(serviceKey), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify(nudgeRows),
        });

        results.sent++;
      } catch (err) {
        results.errors.push({ userId, error: err.message });
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

async function getUserEmails(serviceKey, userIds) {
  // Fetch user records in batches of 1000 from the admin API.
  const emailMap = {};
  let page = 1;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: sbHeaders(serviceKey),
    });
    if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
    const data = await res.json();
    if (!data.users?.length) break;
    for (const user of data.users) {
      if (userIds.includes(user.id) && user.email) {
        emailMap[user.id] = user.email;
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  return emailMap;
}

function sbHeaders(serviceKey) {
  return {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };
}

// ─── Resend helper ───────────────────────────────────────────────────────────

async function sendEmail(apiKey, from, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || `Resend error ${res.status}`);
  }
  return res.json();
}
