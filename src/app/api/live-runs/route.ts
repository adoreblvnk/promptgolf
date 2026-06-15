import { NextResponse, type NextRequest } from "next/server";
import { startLiveRun } from "@/lib/promptgolf/live-runner";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { prompt?: unknown; challengeSlug?: unknown };
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const challengeSlug = typeof body.challengeSlug === "string" ? body.challengeSlug : "mini-checkout-promo-engine";

  if (prompt.trim().length < 12) {
    return NextResponse.json({ error: "Prompt must describe the checkout app in at least 12 characters." }, { status: 400 });
  }

  const run = startLiveRun({ prompt, challengeSlug, origin: request.nextUrl.origin });
  return NextResponse.json({ id: run.id, runId: run.id, status: run.status, url: `/live-runs/${run.id}` }, { status: 202 });
}
