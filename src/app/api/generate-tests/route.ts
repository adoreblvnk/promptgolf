import { NextResponse } from "next/server";
import { generateLiveTestDrafts } from "@/lib/promptgolf";
import { getModelPolicy } from "@/lib/promptgolf/model";
import { validateGenerateTestsInput } from "@/lib/promptgolf/generate-tests-input";
import { readBoundedJson } from "@/lib/promptgolf/request-json";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readBoundedJson(request);
  if (!body.success) return NextResponse.json({ error: body.message, code: "invalid-request-body" }, { status: body.status });
  const input = validateGenerateTestsInput(body.data);
  if (!input.success) {
    return NextResponse.json({ error: input.message }, { status: 400 });
  }

  const draft = await generateLiveTestDrafts(input.data.specs);
  const ok = draft.provider.status === "connected";

  return NextResponse.json(
    {
      mode: ok ? "live-provider" : "provider-degraded",
      policy: getModelPolicy(),
      provider: draft.provider,
      message: ok
        ? "Generated evaluator drafts came from TokenRouter-first routing for cache-friendly hidden specs, with Agnes AI as fallback. Final scoring still comes from deterministic Playwright execution and PromptGolf's scoring algorithm."
        : "No live test-generation adapter completed successfully. Returning an honest degraded state without pretending provider-generated tests exist.",
      tests: draft.tests,
    },
    { status: ok ? 200 : 503 },
  );
}
