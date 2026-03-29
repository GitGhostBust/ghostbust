import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }

  const { query, location, page } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    const params = new URLSearchParams({
      query: location ? `${query} in ${location}` : query,
      page: String(page || 1),
      num_pages: "1",
      date_posted: "month",
    });

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      Sentry.captureMessage(`JSearch API error: ${response.status} ${text.slice(0, 200)}`);
      await Sentry.flush(2000);
      return res.status(response.status).json({ error: "Job search temporarily unavailable." });
    }

    const json = await response.json();
    const listings = (json.data || []).map((job) => ({
      id: job.job_id || Math.random().toString(36).slice(2),
      title: job.job_title || "",
      company: job.employer_name || "",
      location: [job.job_city, job.job_state].filter(Boolean).join(", ") || job.job_location || "",
      job_board: job.job_publisher || "",
      posted: job.job_posted_at_datetime_utc || null,
      description: job.job_description || "",
      apply_url: job.job_apply_link || job.job_google_link || "",
      employer_logo: job.employer_logo || null,
      job_type: job.job_employment_type || "",
      salary: job.job_salary || null,
      min_salary: job.job_min_salary || null,
      max_salary: job.job_max_salary || null,
    }));

    return res.status(200).json({
      listings,
      total: json.total || listings.length,
    });
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }
}
