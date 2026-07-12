import { NextResponse } from "next/server";
import { resolvePromptSubmission, runs } from "@/lib/promptgolf";
import { validateLiveRunInput } from "@/lib/promptgolf/live-run-input";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = validateLiveRunInput(body);
  if (!input.success) {
    const status = input.code === "unknown-challenge" ? 404 : input.code === "challenge-not-live" ? 409 : 400;
    return NextResponse.json({ error: input.message, code: input.code }, { status });
  }

  return NextResponse.json(await resolvePromptSubmission(input.data));
}
