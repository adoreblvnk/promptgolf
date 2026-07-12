import { describe, expect, it } from "vitest";
import { consumeRateLimit, rateLimitResponse, requestClientKey } from "./rate-limit";

describe("expensive endpoint rate limits", () => {
  it("allows a bounded number of requests and reports the cooldown", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(consumeRateLimit(key, { limit: 2, windowMs: 10_000, now: 1_000 })).toMatchObject({ allowed: true, remaining: 1 });
    expect(consumeRateLimit(key, { limit: 2, windowMs: 10_000, now: 2_000 })).toMatchObject({ allowed: true, remaining: 0 });
    expect(consumeRateLimit(key, { limit: 2, windowMs: 10_000, now: 2_001 })).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 9,
    });
    expect(consumeRateLimit(key, { limit: 2, windowMs: 10_000, now: 11_000 })).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("uses the first forwarded address and bounds attacker-controlled keys", () => {
    const request = new Request("https://promptgolf.run/api/live-runs", {
      headers: { "x-forwarded-for": `${"1".repeat(200)}, 10.0.0.2` },
    });
    expect(requestClientKey(request)).toBe("1".repeat(128));
  });

  it("returns a non-cacheable 429 response", async () => {
    const response = rateLimitResponse({ allowed: false, remaining: 0, retryAfterSeconds: 12 });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("12");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ code: "rate-limit-exceeded" });
  });
});