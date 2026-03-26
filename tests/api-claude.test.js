import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Sentry before importing handler
vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(),
}));

// Mock rate limit — allowed by default
vi.mock("../api/lib/rateLimit.js", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 19, retryAfter: 0 }),
}));

import handler from "../api/claude.js";
import { checkRateLimit } from "../api/lib/rateLimit.js";

function mockReq(overrides = {}) {
  return { method: "POST", headers: { authorization: "Bearer test-token" }, body: { model: "claude-sonnet-4-20250514", max_tokens: 100, messages: [{ role: "user", content: "hi" }] }, ...overrides };
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
  // Re-mock rateLimit after restoreAllMocks
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19, retryAfter: 0 });
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
});

describe("POST /api/claude", () => {
  it("rejects non-POST requests", async () => {
    const res = mockRes();
    await handler(mockReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
    expect(res.body.error).toMatch(/method/i);
  });

  it("rejects requests without auth token", async () => {
    const res = mockRes();
    await handler(mockReq({ headers: {} }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/authentication/i);
  });

  it("rejects invalid auth tokens", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 401 }));
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    // Auth succeeds
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    }));
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfter: 1800 });

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBe("1800");
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    // Auth succeeds
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    }));

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(500);
  });

  it("proxies successful Anthropic response", async () => {
    const anthropicResponse = { id: "msg_123", content: [{ text: "hello" }] };
    vi.stubGlobal("fetch", vi.fn()
      // First call: auth
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "user-123" }) })
      // Second call: Anthropic API
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(anthropicResponse) })
    );

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe("msg_123");
  });

  it("forwards Anthropic API errors", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "user-123" }) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: { message: "Invalid request" } }) })
    );

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request");
  });

  it("returns 500 on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "user-123" }) })
      .mockRejectedValueOnce(new Error("Network error"))
    );

    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/temporarily unavailable/i);
  });
});
