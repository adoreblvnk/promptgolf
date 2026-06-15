import { NextResponse, type NextRequest } from "next/server";
import { getLiveRun } from "@/lib/promptgolf/live-run-store";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run) return NextResponse.json({ error: "Live run not found. In-memory demo runs reset when the server restarts." }, { status: 404 });
  const safeRun = {
    id: run.id,
    challengeSlug: run.challengeSlug,
    status: run.status,
    stage: run.stage,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    providerMode: run.providerMode,
    sandboxMode: run.sandboxMode,
    previewUrl: run.previewUrl,
    previewLabel: run.previewLabel,
    tests: run.tests,
    score: run.score,
    diagnosis: run.diagnosis,
    providerState: run.providerState,
    events: run.events,
    error: run.error,
  };
  return NextResponse.json(safeRun);
}
