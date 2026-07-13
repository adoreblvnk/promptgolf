"use client";

import { useRef, useState } from "react";
import { Check, Command, LoaderCircle, Ruler, Send } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { meetsMinimumSpecLength } from "@/lib/promptgolf/spec-validation";

export function SpecEditor({ action, challengeSlug, starterPrompt, maxLength }: { action: (formData: FormData) => void; challengeSlug: string; starterPrompt: string; maxLength: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [prompt, setPrompt] = useState(starterPrompt);
  const [lengthCheck, setLengthCheck] = useState<"idle" | "ready" | "short">("idle");

  function checkLength() {
    setLengthCheck(meetsMinimumSpecLength(prompt) ? "ready" : "short");
  }

  return (
    <form ref={formRef} className="flex min-h-0 flex-1 flex-col" action={action} onKeyDown={(event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }}>
      <input type="hidden" name="challengeSlug" value={challengeSlug} />
      <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-rule bg-white/[0.018] px-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted">
          <span className="rounded bg-white/[0.06] px-2 py-1 text-ink-soft">spec.prompt.md</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">Plain text</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-ink-muted"><Command className="size-3" aria-hidden="true" /> Ctrl/⌘ Enter</div>
      </div>
      <label className="sr-only" htmlFor="prompt-submission">Prompt submission</label>
      <textarea
        id="prompt-submission"
        name="prompt"
        defaultValue={starterPrompt}
        onChange={(event) => { setPrompt(event.target.value); setLengthCheck("idle"); }}
        className="min-h-[300px] flex-1 resize-none bg-[#111317] p-4 font-mono text-[13px] leading-6 text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-warn/60 sm:p-5"
        aria-label="Prompt submission"
        required
        maxLength={maxLength}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="shrink-0 border-t border-rule bg-card">
        <div className="flex min-h-9 items-center justify-between gap-3 border-b border-rule px-3 font-mono text-[10px] text-ink-muted">
          <span aria-live="polite" className={cn("inline-flex items-center gap-1.5", lengthCheck === "ready" && "text-pass", lengthCheck === "short" && "text-fail")}>
            {lengthCheck === "ready" ? <><Check className="size-3" aria-hidden="true" /> Length requirement met</> : lengthCheck === "short" ? "Enter at least 20 non-whitespace characters" : "Minimum length: 20 characters"}
          </span>
          <span className="tabular-nums">{prompt.length.toLocaleString()} / {maxLength.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-[11px] leading-5 text-ink-muted">
            <strong className="font-medium text-ink-soft">Builder</strong> OpenAI gpt-5.4-mini · <strong className="font-medium text-ink-soft">Runtime</strong> Daytona · <strong className="font-medium text-ink-soft">Judge</strong> Playwright
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button type="button" onClick={checkLength} className="inline-flex min-h-9 items-center gap-1.5 rounded border border-rule px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-white/[0.05] hover:text-ink">
              <Ruler className="size-3.5" aria-hidden="true" /> Check length
            </button>
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded bg-accent px-4 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-wait disabled:opacity-60">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}
      {pending ? "Submitting…" : "Submit spec"}
    </button>
  );
}
