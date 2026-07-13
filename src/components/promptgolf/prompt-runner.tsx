"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpecEditor } from "@/components/promptgolf/spec-editor";
import { MAX_LIVE_PROMPT_LENGTH, MIN_LIVE_PROMPT_LENGTH } from "@/lib/promptgolf/live-run-limits";

const starterPrompt = `Build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.`;

export function PromptRunner({ challengeSlug = "mini-checkout-promo-engine" }: { challengeSlug?: string }) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string>();

  async function submitPrompt(formData: FormData) {
    setSubmissionError(undefined);
    try {
      const response = await fetch("/api/live-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: formData.get("prompt"),
          challengeSlug: formData.get("challengeSlug"),
        }),
      });
      const payload = await response.json().catch(() => undefined) as { error?: string; url?: string } | undefined;
      if (!response.ok || !payload?.url) {
        setSubmissionError(payload?.error ?? "The live run could not start. Retry shortly.");
        return;
      }
      router.push(payload.url);
    } catch {
      setSubmissionError("The live run could not start. Check your connection and retry.");
    }
  }

  return (
    <SpecEditor
      action={submitPrompt}
      challengeSlug={challengeSlug}
      starterPrompt={starterPrompt}
      minLength={MIN_LIVE_PROMPT_LENGTH}
      maxLength={MAX_LIVE_PROMPT_LENGTH}
      submissionError={submissionError}
    />
  );
}
