import { NextResponse } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";
import { fetchAllowedPreview, isAllowedPreviewTarget } from "@/lib/promptgolf/preview-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    upstream = await fetchAllowedPreview(target, requestUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 160) : "fetch failed";
    const status = detail.includes("not allowed") || detail.includes("redirect") ? 400 : 502;
    return NextResponse.json({ error: `Preview fetch failed: ${detail}` }, { status });
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
