import { NextResponse } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";
import { fetchAllowedPreview, isAllowedPreviewTarget, readPreviewBody } from "@/lib/promptgolf/preview-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rewritePreviewHtml(html: string, target: URL) {
  const staticPrefix = `${target.origin}/_next/static`;
  return html.replace(/\b(src|href)=(['"])\/(?!\/)([^'"#?]+)([^'"]*)\2/g, (_match, attribute: string, quote: string, pathname: string, suffix: string) => {
    const asset = new URL(`/${pathname}`, target.origin);
    asset.search = target.search;
    return `${attribute}=${quote}${asset.toString()}${suffix}${quote}`;
  }).replace(/url\((['"]?)\/(?!\/)([^)'"#?]+)([^)'"]*)\1\)/g, (_match, quote: string, pathname: string, suffix: string) => {
    const asset = new URL(`/${pathname}`, target.origin);
    asset.search = target.search;
    return `url(${quote}${asset.toString()}${suffix}${quote})`;
  }).replace(/\\"\/_next\/static/g, `\\"${staticPrefix}`)
    .replace(/"\/_next\/static/g, `"${staticPrefix}`)
    .replace(/'\/_next\/static/g, `'${staticPrefix}`);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  const storedPreviewUrl = run?.upstreamPreviewUrl ?? run?.previewUrl;
  if (!storedPreviewUrl) return NextResponse.json({ error: "Preview URL is not available for this live run." }, { status: 404 });

  const requestUrl = new URL(_request.url);
  let target: URL;
  try {
    target = new URL(storedPreviewUrl, requestUrl.origin);
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

  let body: Uint8Array;
  try {
    body = await readPreviewBody(upstream);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "response body was unavailable";
    return NextResponse.json({ error: `Preview fetch failed: ${detail}` }, { status: 502 });
  }
  const contentType = upstream.headers.get("content-type") ?? "text/html; charset=utf-8";
  const isHtml = contentType.toLowerCase().includes("text/html");
  const responseBody = isHtml ? new TextEncoder().encode(rewritePreviewHtml(new TextDecoder().decode(body), target)) : body;
  const allowedOrigin = target.origin;

  return new NextResponse(Buffer.from(responseBody), {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "content-security-policy": `sandbox allow-scripts allow-forms allow-modals; default-src 'self' 'unsafe-inline' data: blob: ${allowedOrigin}; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${allowedOrigin}; style-src 'self' 'unsafe-inline' ${allowedOrigin}; img-src 'self' data: blob: ${allowedOrigin}; font-src 'self' data: ${allowedOrigin}; connect-src 'self' ${allowedOrigin}; frame-ancestors 'self';`,
      "x-content-type-options": "nosniff",
    },
  });
}
