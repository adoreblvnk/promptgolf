import { describe, expect, it } from "vitest";
import { isTrustedMutationRequest, untrustedMutationResponse } from "./request-origin";

const endpoint = "https://promptgolf.run/api/live-runs";

function request(headers: HeadersInit = {}) {
  return new Request(endpoint, { method: "POST", headers });
}

describe("mutation request origin policy", () => {
  it("allows same-origin and same-site browser requests", () => {
    expect(isTrustedMutationRequest(request({ origin: "https://promptgolf.run", "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isTrustedMutationRequest(request({ "sec-fetch-site": "same-site" }))).toBe(true);
  });

  it("allows API clients without browser provenance headers", () => {
    expect(isTrustedMutationRequest(request())).toBe(true);
  });

  it("rejects cross-site browser requests even when Origin is absent", () => {
    expect(isTrustedMutationRequest(request({ "sec-fetch-site": "cross-site" }))).toBe(false);
  });

  it("rejects foreign, null, and malformed origins", () => {
    expect(isTrustedMutationRequest(request({ origin: "https://attacker.example" }))).toBe(false);
    expect(isTrustedMutationRequest(request({ origin: "null" }))).toBe(false);
    expect(isTrustedMutationRequest(request({ origin: "://bad" }))).toBe(false);
  });

  it("returns a non-cacheable structured denial", async () => {
    const response = untrustedMutationResponse();
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toContain("Origin");
    await expect(response.json()).resolves.toMatchObject({ code: "cross-site-request" });
  });
});
