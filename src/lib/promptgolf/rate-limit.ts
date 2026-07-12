type Bucket = { count: number; resetAt: number };

type RateLimitStore = Map<string, Bucket>;

const globalKey = "__promptgolf_rate_limits__";
const MAX_BUCKETS = 2_000;

function store(): RateLimitStore {
  const root = globalThis as typeof globalThis & { [globalKey]?: RateLimitStore };
  root[globalKey] ??= new Map();
  return root[globalKey];
}

function prune(now: number) {
  const buckets = store();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value as string | undefined;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

export type RateLimitResult =
  | { allowed: true; remaining: number; retryAfterSeconds: 0 }
  | { allowed: false; remaining: 0; retryAfterSeconds: number };

/** Process-local guard for expensive demo endpoints. A distributed deployment should use a shared store. */
export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number; now?: number },
): RateLimitResult {
  const now = options.now ?? Date.now();
  if (!Number.isInteger(options.limit) || options.limit < 1 || !Number.isFinite(options.windowMs) || options.windowMs < 1) {
    throw new TypeError("Rate limit options must be positive.");
  }

  prune(now);
  const buckets = store();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }
  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }
  current.count += 1;
  return { allowed: true, remaining: options.limit - current.count, retryAfterSeconds: 0 };
}

export function requestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const platformIp = request.headers.get("cf-connecting-ip")?.trim() || request.headers.get("x-real-ip")?.trim();
  return (platformIp || forwarded || "unknown").slice(0, 128);
}

export function rateLimitResponse(result: Extract<RateLimitResult, { allowed: false }>) {
  return Response.json(
    { error: "Too many requests. Retry after the cooldown.", code: "rate-limit-exceeded" },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" } },
  );
}
