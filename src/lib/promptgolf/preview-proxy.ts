const MAX_PREVIEW_REDIRECTS = 3;

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;

  const octets = lower.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [first, second] = octets;
  return first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

export function isAllowedPreviewTarget(target: URL, requestUrl: URL) {
  if (!["http:", "https:"].includes(target.protocol)) return false;
  if (target.username || target.password) return false;
  if (target.origin === requestUrl.origin) return true;
  if (isPrivateHostname(target.hostname)) return false;
  return [
    /(^|\.)daytonaproxy\d*\.net$/,
    /(^|\.)proxy\.daytona\.works$/,
    /(^|\.)daytona\.works$/,
    /(^|\.)daytona\.io$/,
  ].some((pattern) => pattern.test(target.hostname.toLowerCase()));
}

/** Fetches a stored preview URL without allowing an approved host to redirect the proxy elsewhere. */
export async function fetchAllowedPreview(target: URL, requestUrl: URL, fetcher: typeof fetch = fetch) {
  let current = target;
  for (let redirectCount = 0; redirectCount <= MAX_PREVIEW_REDIRECTS; redirectCount += 1) {
    if (!isAllowedPreviewTarget(current, requestUrl)) throw new Error("Preview host is not allowed for same-origin proxying.");
    const response = await fetcher(current, {
      cache: "no-store",
      redirect: "manual",
      headers: { "X-Daytona-Skip-Preview-Warning": "true", Accept: "text/html" },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("Preview redirect did not include a location.");
    if (redirectCount === MAX_PREVIEW_REDIRECTS) throw new Error("Preview exceeded the redirect limit.");
    current = new URL(location, current);
  }
  throw new Error("Preview exceeded the redirect limit.");
}
