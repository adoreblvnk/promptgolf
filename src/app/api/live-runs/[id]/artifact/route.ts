import { NextResponse, type NextRequest } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";
import { workspaceFile } from "@/lib/promptgolf/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run?.artifactWorkspace) return NextResponse.json({ error: "Generated workspace is not ready yet." }, { status: 404 });
  const preview = workspaceFile(run.artifactWorkspace, run.artifactWorkspace.entrypoints.preview);
  if (!preview) return NextResponse.json({ error: "Workspace preview entrypoint is missing." }, { status: 500 });
  return new Response(preview, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline' data:; frame-ancestors 'self';",
    },
  });
}
