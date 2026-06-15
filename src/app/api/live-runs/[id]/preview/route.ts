import { NextResponse } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return false;
  if (/^(10|127)\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  if (lower === "0.0.0.0" || lower === "::1") return true;
  return false;
}

function isAllowedPreviewTarget(target: URL, requestUrl: URL) {
  if (!["http:", "https:"].includes(target.protocol)) return false;
  if (target.origin === requestUrl.origin) return true;
  if (isPrivateHostname(target.hostname)) return false;
  if (/(^|\.)daytonaproxy\d*\.net$/.test(target.hostname)) return true;
  if (/(^|\.)proxy\.daytona\.works$/.test(target.hostname)) return true;
  if (/(^|\.)daytona\.works$/.test(target.hostname)) return true;
  if (/(^|\.)daytona\.io$/.test(target.hostname)) return true;
  return false;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run?.previewUrl) return NextResponse.json({ error: "Preview URL is not available for this live run." }, { status: 404 });

  const requestUrl = new URL(_request.url);
  let target: URL;
  try {
    target = new URL(run.previewUrl, requestUrl.origin);
  } catch {
    return NextResponse.json({ error: "Preview URL is invalid." }, { status: 400 });
  }

  if (!isAllowedPreviewTarget(target, requestUrl)) {
    return NextResponse.json({ error: "Preview host is not allowed for same-origin proxying." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      cache: "no-store",
      redirect: "follow",
      headers: { "X-Daytona-Skip-Preview-Warning": "true", Accept: "text/html" },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 160) : "fetch failed";
    return NextResponse.json({ error: `Preview fetch failed: ${detail}` }, { status: 502 });
  }

  const body = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "text/html; charset=utf-8";

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
