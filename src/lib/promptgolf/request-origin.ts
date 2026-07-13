const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

/**
 * Protects provider-backed POST endpoints from cross-site browser requests.
 * Requests without browser provenance headers remain available to CLI/API clients.
 */
export function isTrustedMutationRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite && !SAFE_FETCH_SITES.has(fetchSite)) return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (originUrl.origin === requestUrl.origin) return true;

    // Reverse proxies and the Next.js development server can rewrite the
    // request URL host while preserving the browser-facing Host headers.
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const browserFacingHost = forwardedHost || request.headers.get("host");
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const browserFacingProtocol = forwardedProtocol ? `${forwardedProtocol}:` : requestUrl.protocol;
    return originUrl.host === browserFacingHost && originUrl.protocol === browserFacingProtocol;
  } catch {
    return false;
  }
}

export function untrustedMutationResponse() {
  return Response.json(
    { error: "Cross-site requests are not allowed.", code: "cross-site-request" },
    { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin, Sec-Fetch-Site" } },
  );
}
