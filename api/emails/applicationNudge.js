// Email template for the 30-day stale application nudge.
// apps: array of { id, company, title, applied_date, ghost_score }

export function applicationNudgeEmail(apps) {
  const subject = apps.length === 1
    ? `you applied to ${apps[0].company} 30 days ago — did you hear back?`
    : `you have ${apps.length} applications with no update`;

  const appRows = apps.map(function(app) {
    const appliedStr = app.applied_date
      ? new Date(app.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'date unknown';
    const scoreStr = app.ghost_score ? ` &middot; ghost score ${app.ghost_score}/100` : '';
    const base = `https://ghostbust.us/app.html?tab=tracker`;

    return `<tr>
      <td style="padding:20px 0;border-bottom:1px solid #e8e5df;">
        <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:bold;color:#111111;">${esc(app.company)}</p>
        <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#555555;">${esc(app.title)} &middot; applied ${appliedStr}${scoreStr}</p>
        <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.06em;">
          <a href="${base}&appId=${app.id}&markAs=Ghosted" style="color:#d42200;text-decoration:none;margin-right:20px;">GHOSTED &rarr;</a>
          <a href="${base}&appId=${app.id}&markAs=Rejected" style="color:#d42200;text-decoration:none;margin-right:20px;">REJECTED &rarr;</a>
          <a href="${base}" style="color:#999999;text-decoration:none;">STILL ACTIVE &rarr;</a>
        </p>
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0ede6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-top:4px solid #d42200;">
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <span style="font-family:Arial Black,'Arial Bold',Impact,sans-serif;font-size:19px;letter-spacing:0.04em;color:#111111;">
                Ghost<span style="color:#d42200;">Bust</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.7;color:#111111;">
                ${apps.length === 1
                  ? `This application hasn't been updated in 30 days.`
                  : `These applications haven't been updated in 30 days.`}
              </p>
              <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.7;color:#555555;">
                Did you hear back? Mark each one so your tracker stays accurate.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                ${appRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #e8e5df;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#999999;line-height:1.7;">
                GhostBust &middot; <a href="https://ghostbust.us" style="color:#999999;text-decoration:none;">ghostbust.us</a><br>
                You're receiving this because you have open applications in your GhostBust tracker.<br>
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

  return { subject, html };
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
