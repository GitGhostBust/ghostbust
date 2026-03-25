// Onboarding email HTML templates.
// All return { subject, html } given a context object.

function wrap(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0ede6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-top:4px solid #d42200;">
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <span style="font-family:Arial Black,'Arial Bold',Impact,sans-serif;font-size:19px;letter-spacing:0.04em;color:#111111;text-decoration:none;">
                Ghost<span style="color:#d42200;">Bust</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 36px 40px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.85;color:#111111;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px;border-top:1px solid #e8e5df;">
              <p style="margin:20px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#999999;line-height:1.7;">
                GhostBust &middot; <a href="https://ghostbust.us" style="color:#999999;text-decoration:none;">ghostbust.us</a><br>
                You're receiving this because you created a GhostBust account.<br>
                <a href="{{{unsubscribe_url}}}" style="color:#999999;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function cta(url, label) {
  return `<p style="margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#d42200;color:#ffffff;text-decoration:none;padding:12px 26px;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${label} &rarr;</a>
  </p>`;
}

function signal(title, body) {
  return `<p style="margin:16px 0 4px 0;"><strong style="color:#111111;">${title}</strong></p>
  <p style="margin:0 0 0 0;color:#444444;">${body}</p>`;
}

// ─────────────────────────────────────────────
// EMAIL 1 — DAY 0
// ─────────────────────────────────────────────
export function day0() {
  return {
    subject: "You're a Founding Member. Here's what that means.",
    preheader: "Pro access, free for life. No expiration. No catch.",
    html: wrap(`
      <p style="margin:0 0 18px;">The Human Capital Institute found that 75% of applicants never hear back after applying.</p>
      <p style="margin:0 0 18px;">Not because they weren't qualified. Because the process isn't designed to respond.</p>
      <p style="margin:0 0 18px;">That's what GhostBust is built against.</p>
      <p style="margin:0 0 18px;">You're a Founding Member. That means Pro access — every feature, free for life. When paid tiers launch, you won't see a bill. This tier closes when the early window closes, and it doesn't reopen.</p>
      <p style="margin:0 0 18px;">One place to start: the Ghost Detector tab. Paste a job you're considering and get a ghost job score in under a minute. No setup, no resume required.</p>
      ${cta('https://ghostbust.us/app.html', 'Open GhostBust')}
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}

// ─────────────────────────────────────────────
// EMAIL 2 — DAY 2
// ─────────────────────────────────────────────
export function day2() {
  return {
    subject: "five things that show up in ghost job listings",
    preheader: "None are definitive alone. But when they stack up.",
    html: wrap(`
      <p style="margin:0 0 20px;">A few patterns worth knowing before you apply anywhere.</p>

      ${signal(
        'The description is vague by design.',
        'Generic responsibilities, no specifics about team or scope. Written to attract résumés, not fill a role.'
      )}
      ${signal(
        'No hiring manager is visible anywhere.',
        'Ghost postings tend to route to a black-box inbox. Real ones usually have a name attached somewhere.'
      )}
      ${signal(
        "It's been reposted.",
        'Same listing, refreshed every few weeks. Signals the company either can\'t close the hire or never intended to.'
      )}
      ${signal(
        "It's been up for 45+ days.",
        'The Society for Human Resource Management puts average time-to-fill at 41 days. Anything older is worth questioning.'
      )}
      ${signal(
        "It's in a state that requires salary disclosure — and there isn't one.",
        'Colorado, New York, California, Washington, and others require it. Omission in those states is a flag.'
      )}

      <p style="margin:20px 0 18px;color:#444444;">No single signal is conclusive. When three or four stack up, the posting usually isn't real.</p>
      <p style="margin:0 0 18px;">GhostBust scores against all of these automatically. Paste a listing you're considering and see where it lands before you spend two hours on an application.</p>
      ${cta('https://ghostbust.us/app.html', 'Verify a Listing')}
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}

// ─────────────────────────────────────────────
// EMAIL 3 — DAY 5
// ─────────────────────────────────────────────
export function day5() {
  return {
    subject: "your resume may never reach a human",
    preheader: "88% of employers say they've lost qualified candidates to ATS filtering.",
    html: wrap(`
      <p style="margin:0 0 18px;">Jobscan found that 75% of résumés are filtered out by ATS software before a recruiter ever reads them.</p>
      <p style="margin:0 0 18px;">Harvard Business Review followed up: 88% of employers believe they've lost qualified candidates because the system screened them out on a technicality.</p>
      <p style="margin:0 0 18px;">So the problem is doubled — listings that aren't real, and a screening process that discards real candidates.</p>
      <p style="margin:0 0 20px;">Career HQ in the app is built for the second half of that. Four modes:</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:2px solid #d42200;margin:0 0 20px;">
        <tr><td style="padding:6px 0 6px 16px;font-size:13px;line-height:1.7;">
          <strong>General Review</strong> &mdash; overall strength, formatting, gaps, red flags, top next steps.<br>
          <strong>Job-Specific Analysis</strong> &mdash; paste a listing and see exactly how your résumé matches up. Keyword gaps, ATS score, bullet rewrites, cover letter.<br>
          <strong>Job Search Advisor</strong> &mdash; target role guidance, search strategy, market positioning.<br>
          <strong>Career Coach</strong> &mdash; longer arc. Skill gaps, trajectory, where you're headed vs. where you want to go.
        </td></tr>
      </table>

      <p style="margin:0 0 18px;">It's a Pro feature. You have it free, permanently.</p>
      ${cta('https://ghostbust.us/app.html', 'Open Career HQ')}
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}

// ─────────────────────────────────────────────
// EMAIL 4 — DAY 14
// ─────────────────────────────────────────────
export function day14() {
  return {
    subject: "72% of job seekers say the search damaged their mental health",
    preheader: "That number isn't surprising. What to do with it.",
    html: wrap(`
      <p style="margin:0 0 18px;">A 2025 survey found that 72% of U.S. job seekers said the search process negatively affected their mental health.</p>
      <p style="margin:0 0 18px;">That's not a niche finding. That's most people doing what you're doing, in an environment designed to extract effort and return as little as possible.</p>
      <p style="margin:0 0 18px;">One thing that helps — not fixes, but helps — is knowing you're not reading the market wrong. Other people are finding the same patterns. The same companies keep showing up in scans. The same industries have the worst ghost job ratios. The same regions are seeing hiring slow down or pick up.</p>
      <p style="margin:0 0 18px;">The Community board is where that gets shared — real observations from people actively searching, by industry, by region, by company.</p>
      ${cta('https://ghostbust.us/community.html', 'Go to Community')}
      <p style="margin:0 0 18px;">And if you haven't run a scan yet: paste a listing, get a score. Less than a minute.</p>
      ${cta('https://ghostbust.us/app.html', 'Verify a Listing')}
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}

// ─────────────────────────────────────────────
// EMAIL 5 — DAY 30 (active user)
// ─────────────────────────────────────────────
export function day30Active() {
  return {
    subject: "a month in",
    preheader: "Your Founding Member status is permanent. A stat worth sitting with.",
    html: wrap(`
      <p style="margin:0 0 18px;">According to The Interview Guys' 2025 job search report, you're now three times less likely to hear back from an employer than you were in 2021. Application volume tripled. Response rates didn't follow.</p>
      <p style="margin:0 0 18px;">That's the market. Not a rough patch — a structural shift.</p>
      <p style="margin:0 0 18px;">Your Founding Member status is permanent. When GhostBust moves to paid tiers, nothing changes for you. No retroactive billing, no downgrade, no expiration. You're locked in.</p>
      <p style="margin:0 0 18px;">If something in the app isn't working, or you keep running into something it should do and doesn't — reply to this email. We read every response and we're actively building. What you're running into in your search right now is directly useful to us.</p>
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}

// ─────────────────────────────────────────────
// EMAIL 5 — DAY 30 (dormant user)
// ─────────────────────────────────────────────
export function day30Dormant() {
  return {
    subject: "no pressure — but the market got harder",
    preheader: "3x less likely to hear back than in 2021. Your spot is still here.",
    html: wrap(`
      <p style="margin:0 0 18px;">You signed up a month ago. We haven't seen you in the app. That's fine.</p>
      <p style="margin:0 0 18px;">One thing worth knowing: The Interview Guys' 2025 research found you're now three times less likely to hear back from employers than you were in 2021. The market got harder while most job search tools stayed the same.</p>
      <p style="margin:0 0 18px;">Your Founding Member spot didn't go anywhere. Pro access, free for life, still waiting.</p>
      ${cta('https://ghostbust.us/app.html', 'Open GhostBust')}
      <p style="margin:0;">&mdash;&nbsp;GhostBust</p>
    `)
  };
}
