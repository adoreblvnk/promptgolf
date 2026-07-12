import { NextResponse, type NextRequest } from "next/server";
import { startLiveRun } from "@/lib/promptgolf/live-runner";
import { validateLiveRunInput } from "@/lib/promptgolf/live-run-input";
import { RunQueueFullError } from "@/lib/promptgolf/run-scheduler";
import { readBoundedJson } from "@/lib/promptgolf/request-json";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request);
  if (!body.success) return NextResponse.json({ error: body.message, code: "invalid-request-body" }, { status: body.status });
  const input = validateLiveRunInput(body.data);
  if (!input.success) {
    const status = input.code === "unknown-challenge" ? 404 : input.code === "challenge-not-live" ? 409 : 400;
    return NextResponse.json({ error: input.message, code: input.code }, { status });
  }

  let run;
  try {
    run = startLiveRun(input.data);
  } catch (error) {
    if (error instanceof RunQueueFullError) {
      return NextResponse.json(
        { error: error.message, code: "run-queue-full" },
        { status: 429, headers: { "Retry-After": "30" } },
      );
    }
    throw error;
  }
  return NextResponse.json({ id: run.id, runId: run.id, status: run.status, url: `/live-runs/${run.id}` }, { status: 202 });
}
