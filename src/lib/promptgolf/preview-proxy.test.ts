import { describe, expect, it, vi } from "vitest";
import { fetchAllowedPreview, isAllowedPreviewTarget, readPreviewBody } from "./preview-proxy";

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

  it("bounds upstream fetches with an abort signal", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response("ok", { status: 200 });
    });

    await fetchAllowedPreview(new URL("https://workspace.proxy.daytona.works"), requestUrl, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe("preview proxy response limits", () => {
  it("reads a response within the configured byte limit", async () => {
    const body = await readPreviewBody(new Response("checkout ready"), 32);
    expect(new TextDecoder().decode(body)).toBe("checkout ready");
  });

  it("rejects an oversized declared content length before reading", async () => {
    const response = new Response("small", { headers: { "content-length": "100" } });
    await expect(readPreviewBody(response, 10)).rejects.toThrow("size limit");
  });

  it("rejects a chunked response that grows beyond the limit", async () => {
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(6));
        controller.enqueue(new Uint8Array(6));
        controller.close();
      },
    }));
    await expect(readPreviewBody(response, 10)).rejects.toThrow("size limit");
  });
});
