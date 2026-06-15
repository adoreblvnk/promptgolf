import { NextResponse } from "next/server";
import { resolvePromptSubmission, runs } from "@/lib/promptgolf";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const challengeSlug = typeof body.challengeSlug === "string" ? body.challengeSlug : "mini-checkout-promo-engine";

  if (prompt.trim().length < 12) {
    return NextResponse.json({ error: "Prompt must describe what the agent should build." }, { status: 400 });
  }

  return NextResponse.json(await resolvePromptSubmission({ prompt, challengeSlug }));
}
