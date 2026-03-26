import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(),
}));

vi.mock("../api/lib/rateLimit.js", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 2, retryAfter: 0 }),
}));

import handler from "../api/subscribe.js";
import { checkRateLimit } from "../api/lib/rateLimit.js";

function mockReq(overrides = {}) {
  return {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: { email: "test@example.com" },
    ...overrides,
  };
}

function mockRes() {
  const res = { statusCode: null, headers: {}, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  return res;
}

beforeEach(() => {
  vi.restoreAllMocks();
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, retryAfter: 0 });
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.RESEND_AUDIENCE_ID = "test-audience-id";
});

describe("POST /api/subscribe", () => {
  it("rejects non-POST requests", async () => {
    const res = mockRes();
    await handler(mockReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfter: 3600 });
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBe("3600");
  });

  it("rejects missing email", async () => {
    const res = mockRes();
    await handler(mockReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("rejects invalid email formats", async () => {
    const badEmails = ["notanemail", "foo@", "@bar.com", "a b@c.com", ""];
    for (const email of badEmails) {
      const res = mockRes();
      await handler(mockReq({ body: { email } }), res);
      expect(res.statusCode).toBe(400);
    }
  });

  it("accepts valid email and calls Resend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "contact-123" }),
    }));

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify Resend was called with correct URL
    const fetchCall = fetch.mock.calls[0];
    expect(fetchCall[0]).toContain("test-audience-id");
    expect(fetchCall[0]).toContain("resend.com");
  });

  it("returns error when Resend fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Audience not found" }),
    }));

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Audience not found");
  });

  it("returns 500 on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network error")));

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/server error/i);
  });

  it("extracts IP from x-forwarded-for for rate limiting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "c-1" }),
    }));

    const res = mockRes();
    await handler(mockReq({ headers: { "x-forwarded-for": "9.8.7.6, 1.2.3.4" } }), res);

    expect(checkRateLimit).toHaveBeenCalledWith("subscribe:9.8.7.6", 3, 3600);
  });
});
