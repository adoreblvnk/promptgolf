import { NextResponse } from "next/server";
import { scoreRun } from "@/lib/promptgolf";
import { validateScoreInput } from "@/lib/promptgolf/score-input";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = validateScoreInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.message, code: "invalid-score-input" }, { status: 400 });
  }
  return NextResponse.json({ score: scoreRun(input.data.tests, input.data.uxScore, input.data.promptCount) });
}
