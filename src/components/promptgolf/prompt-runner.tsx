import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Textarea } from "@/components/ui/textarea";
import { startLiveRun } from "@/lib/promptgolf/live-runner";

const starterPrompt = `Build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.`;

async function submitPrompt(formData: FormData) {
  "use server";

  const prompt = String(formData.get("prompt") ?? "");
  const challengeSlug = String(formData.get("challengeSlug") ?? "mini-checkout-promo-engine");

  if (prompt.trim().length < 12) {
    redirect(`/challenges/${challengeSlug}?error=prompt-too-short`);
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const run = startLiveRun({ prompt, challengeSlug, origin: host ? `${proto}://${host}` : undefined });
  redirect(`/live-runs/${run.id}`);
}

export function PromptRunner({ challengeSlug = "mini-checkout-promo-engine" }: { challengeSlug?: string }) {
  return (
    <form className="flex flex-col gap-4" action={submitPrompt}>
      <input type="hidden" name="challengeSlug" value={challengeSlug} />
      <Textarea
        name="prompt"
        defaultValue={starterPrompt}
        className="min-h-56 rounded-md border-rule bg-paper p-5 font-mono text-sm leading-6 text-ink placeholder:text-ink-muted focus-visible:ring-accent/20"
        aria-label="Prompt submission"
        required
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-ink-soft">
          Submits to the live execution path: Agnes AI builds the checkout artifact, the sandbox serves the preview, TokenRouter drafts cache-friendly evaluator checks, and Playwright scores the generated app as-is. Seeded scorecards remain reference runs.
        </p>
        <button
          type="submit"
          className="group inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-ink px-5 text-sm font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-ink/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          Submit prompt
          <span className="ml-2 font-mono transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">→</span>
        </button>
      </div>
    </form>
  );
}
