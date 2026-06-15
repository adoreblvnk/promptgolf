import { NextResponse } from "next/server";
import { scoreRun, type TestResult } from "@/lib/promptgolf";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tests = Array.isArray(body.tests) ? (body.tests as TestResult[]) : [];
  const uxScore = typeof body.uxScore === "number" ? body.uxScore : 7;
  const promptCount = typeof body.promptCount === "number" ? body.promptCount : 1;
  return NextResponse.json({ score: scoreRun(tests, uxScore, promptCount) });
}
