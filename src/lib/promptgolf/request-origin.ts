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
    return new URL(origin).origin === new URL(request.url).origin;
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
