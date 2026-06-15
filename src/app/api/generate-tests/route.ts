import { NextResponse } from "next/server";
import { generateLiveTestDrafts } from "@/lib/promptgolf";
import { getModelPolicy } from "@/lib/promptgolf/model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const specs = Array.isArray(body.specs) ? body.specs : [];
  const draft = await generateLiveTestDrafts(specs as Array<{ title?: unknown }>);
  const ok = draft.provider.status === "connected";

  return NextResponse.json(
    {
      mode: ok ? "live-provider" : "provider-degraded",
      policy: getModelPolicy(),
      provider: draft.provider,
      message: ok
        ? "Generated evaluator drafts came from TokenRouter-first routing for cache-friendly hidden specs, with Kimi as fallback. Final scoring still comes from deterministic Playwright execution and PromptGolf's scoring algorithm."
        : "No live test-generation adapter completed successfully. Returning an honest degraded state without pretending provider-generated tests exist.",
      tests: draft.tests,
    },
    { status: ok ? 200 : 503 },
  );
}
