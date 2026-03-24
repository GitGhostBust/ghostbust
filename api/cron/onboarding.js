import { day0, day2, day5, day14, day30Active, day30Dormant } from '../emails/templates.js';

const SUPABASE_URL = 'https://awhqwqhntgxjvvawzkog.supabase.co';

// Days since signup → email type mapping.
// Window is [delayDays, delayDays + 1) so each email fires exactly once with a daily cron.
const SEQUENCE = [
  { type: 'day_0',  delayDays: 0  },
  { type: 'day_2',  delayDays: 2  },
  { type: 'day_5',  delayDays: 5  },
  { type: 'day_14', delayDays: 14 },
  { type: 'day_30', delayDays: 30 },
];

export default async function handler(req, res) {
  // Vercel injects CRON_SECRET as the Bearer token for scheduled invocations.
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
    const [users, sentRecords] = await Promise.all([
      getAllUsers(serviceKey),
      getSentEmails(serviceKey),
    ]);

    const sent = new Set(sentRecords.map(r => `${r.user_id}:${r.email_type}`));
    const now  = Date.now();
    const results = { sent: 0, skipped: 0, errors: [] };

    for (const step of SEQUENCE) {
      for (const user of users) {
        if (!user.email) continue;

        const key = `${user.id}:${step.type}`;
        if (sent.has(key)) { results.skipped++; continue; }

        const daysSince = (now - new Date(user.created_at).getTime()) / 86_400_000;
        if (daysSince < step.delayDays || daysSince >= step.delayDays + 1) continue;

        let template;
        if (step.type === 'day_30') {
          const isActive = await checkUserActive(serviceKey, user.id);
          template = isActive ? day30Active() : day30Dormant();
        } else {
          template = { day_0: day0, day_2: day2, day_5: day5, day_14: day14 }[step.type]();
        }

        try {
          await sendEmail(resendKey, fromEmail, user.email, template.subject, template.html);
          await recordSend(serviceKey, user.id, step.type);
          results.sent++;
        } catch (err) {
          results.errors.push({ userId: user.id, type: step.type, error: err.message });
        }
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

async function getAllUsers(serviceKey) {
  const users = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: sbHeaders(serviceKey),
    });
    if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
    const data = await res.json();
    if (!data.users?.length) break;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return users;
}

async function getSentEmails(serviceKey) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/email_sends?select=user_id,email_type`,
    { headers: sbHeaders(serviceKey) }
  );
  if (!res.ok) throw new Error(`Failed to fetch sent emails: ${res.status}`);
  return res.json();
}

async function checkUserActive(serviceKey, userId) {
  const headers = sbHeaders(serviceKey);
  const [scansRes, resumesRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/ghost_scans?user_id=eq.${userId}&limit=1&select=id`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/resumes?user_id=eq.${userId}&limit=1&select=id`, { headers }),
  ]);
  const [scans, resumes] = await Promise.all([scansRes.json(), resumesRes.json()]);
  return scans.length > 0 || resumes.length > 0;
}

async function recordSend(serviceKey, userId, emailType) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/email_sends`, {
    method: 'POST',
    headers: { ...sbHeaders(serviceKey), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ user_id: userId, email_type: emailType }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to record send: ${text}`);
  }
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
