import { NextResponse, type NextRequest } from "next/server";
import { startLiveRun } from "@/lib/promptgolf/live-runner";
import { validateLiveRunInput } from "@/lib/promptgolf/live-run-input";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = validateLiveRunInput(body);
  if (!input.success) {
    const status = input.code === "unknown-challenge" ? 404 : input.code === "challenge-not-live" ? 409 : 400;
    return NextResponse.json({ error: input.message, code: input.code }, { status });
  }

  const run = startLiveRun(input.data);
  return NextResponse.json({ id: run.id, runId: run.id, status: run.status, url: `/live-runs/${run.id}` }, { status: 202 });
}
