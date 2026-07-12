import { NextResponse } from "next/server";
import { scoreRun } from "@/lib/promptgolf";
import { validateScoreInput } from "@/lib/promptgolf/score-input";
import { readBoundedJson } from "@/lib/promptgolf/request-json";

export async function POST(request: Request) {
  const body = await readBoundedJson(request);
  if (!body.success) return NextResponse.json({ error: body.message, code: "invalid-request-body" }, { status: body.status });
  const input = validateScoreInput(body.data);
  if (!input.success) {
    return NextResponse.json({ error: input.message, code: "invalid-score-input" }, { status: 400 });
  }
  return NextResponse.json({ score: scoreRun(input.data.tests, input.data.uxScore, input.data.promptCount) });
}
