import { redirect } from "next/navigation";
import { SpecEditor } from "@/components/promptgolf/spec-editor";
import { startLiveRun } from "@/lib/promptgolf/live-runner";
import { MAX_LIVE_PROMPT_LENGTH, validateLiveRunInput } from "@/lib/promptgolf/live-run-input";

const starterPrompt = `Build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.`;

async function submitPrompt(formData: FormData) {
  "use server";

  const input = validateLiveRunInput({ prompt: formData.get("prompt"), challengeSlug: formData.get("challengeSlug") });
  if (!input.success) redirect(`/challenges?error=${input.code}`);
  const run = startLiveRun(input.data);
  redirect(`/live-runs/${run.id}`);
}

export function PromptRunner({ challengeSlug = "mini-checkout-promo-engine" }: { challengeSlug?: string }) {
  return <SpecEditor action={submitPrompt} challengeSlug={challengeSlug} starterPrompt={starterPrompt} maxLength={MAX_LIVE_PROMPT_LENGTH} />;
}
