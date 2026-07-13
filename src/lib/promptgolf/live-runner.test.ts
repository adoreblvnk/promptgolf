import { describe, expect, it, vi } from "vitest";
import { probePreview } from "./live-runner";

describe("sandbox preview readiness probe", () => {
  it("accepts a bounded successful HTML document", async () => {
    const fetcher = vi.fn(async () => new Response("<!doctype html><html><body>ready</body></html>"));

    await expect(probePreview("https://sandbox.example", fetcher as typeof fetch)).resolves.toEqual({
      ready: true,
      observation: "HTML preview is ready",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://sandbox.example",
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects oversized preview bodies without retaining them", async () => {
    const fetcher = vi.fn(async () => new Response("x", { headers: { "content-length": String(512 * 1024 + 1) } }));

    const result = await probePreview("https://sandbox.example", fetcher as typeof fetch);

    expect(result.ready).toBe(false);
    expect(result.observation).toContain("exceeded the size limit");
  });

  it("does not accept a successful non-HTML response", async () => {
    const fetcher = vi.fn(async () => new Response("service starting", { status: 200 }));

    await expect(probePreview("https://sandbox.example", fetcher as typeof fetch)).resolves.toEqual({
      ready: false,
      observation: "HTTP 200; body: service starting",
    });
  });
});