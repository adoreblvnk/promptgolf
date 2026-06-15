import { NextResponse, type NextRequest } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run?.artifactHtml) return NextResponse.json({ error: "Generated artifact is not ready yet." }, { status: 404 });
  return new Response(run.artifactHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline' data:; frame-ancestors 'self';",
    },
  });
}
