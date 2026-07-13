import { NextResponse } from "next/server";
import { getStoredLiveTestDrafts } from "@/lib/promptgolf";
import { getModelPolicy } from "@/lib/promptgolf/model";
import { validateGenerateTestsInput } from "@/lib/promptgolf/generate-tests-input";
import { readBoundedJson } from "@/lib/promptgolf/request-json";
import { consumeRateLimit, rateLimitResponse, requestClientKey } from "@/lib/promptgolf/rate-limit";
import { isTrustedMutationRequest, untrustedMutationResponse } from "@/lib/promptgolf/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return untrustedMutationResponse();
  const globalLimit = consumeRateLimit("generate-tests:global", { limit: 100, windowMs: 60_000 });
  if (!globalLimit.allowed) return rateLimitResponse(globalLimit);
  const rateLimit = consumeRateLimit(`generate-tests:${requestClientKey(request)}`, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
  const body = await readBoundedJson(request);
  if (!body.success) return NextResponse.json({ error: body.message, code: "invalid-request-body" }, { status: body.status });
  const input = validateGenerateTestsInput(body.data);
  if (!input.success) {
    return NextResponse.json({ error: input.message }, { status: 400 });
  }

  const draft = getStoredLiveTestDrafts(input.data.specs);

  return NextResponse.json(
    {
      mode: "stored-evalspecs",
      policy: getModelPolicy(),
      provider: draft.provider,
      message: "Returning checked-in validated EvalSpec titles. Contestant runs do not regenerate evaluator specs; deterministic Playwright executes the stored materialization.",
      tests: draft.tests,
    },
    { status: 200 },
  );
}
