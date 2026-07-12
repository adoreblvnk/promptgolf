import { describe, expect, it, vi } from "vitest";
import { fetchAllowedPreview, isAllowedPreviewTarget } from "./preview-proxy";

const requestUrl = new URL("https://promptgolf.run/api/live-runs/123/preview");

describe("preview proxy target policy", () => {
  it("allows same-origin and Daytona preview hosts", () => {
    expect(isAllowedPreviewTarget(new URL("https://promptgolf.run/generated"), requestUrl)).toBe(true);
    expect(isAllowedPreviewTarget(new URL("https://abc.proxy.daytona.works"), requestUrl)).toBe(true);
    expect(isAllowedPreviewTarget(new URL("https://preview.daytonaproxy2.net"), requestUrl)).toBe(true);
  });

  it.each([
    "http://127.0.0.1/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/admin",
    "https://daytona.io.evil.example/",
    "file:///etc/passwd",
    "https://user:password@daytona.io/",
  ])("rejects unsafe target %s", (target) => {
    expect(isAllowedPreviewTarget(new URL(target), requestUrl)).toBe(false);
  });

  it("revalidates every redirect before making the next request", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data" },
    }));

    await expect(fetchAllowedPreview(new URL("https://workspace.proxy.daytona.works"), requestUrl, fetcher))
      .rejects.toThrow("not allowed");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual" });
  });

  it("follows an allowed relative redirect and returns its response", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: "/ready" } }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const response = await fetchAllowedPreview(new URL("https://workspace.proxy.daytona.works/start"), requestUrl, fetcher);
    expect(await response.text()).toBe("ok");
    expect(String(fetcher.mock.calls[1]?.[0])).toBe("https://workspace.proxy.daytona.works/ready");
  });
});
