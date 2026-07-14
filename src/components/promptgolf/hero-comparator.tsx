"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import type { Run } from "@/lib/promptgolf";
import { cn } from "@/lib/utils";

const STATE_LABELS = {
  Naive: "Naive request",
  Structured: "Structured spec",
  Expert: "Domain-expert spec",
} as const;

const DIAGNOSES = {
  Naive: "This seeded scorecard suggests the brief names the visible product while leaving money, inventory, and concurrency rules unspecified.",
  Structured: "This seeded scorecard suggests the acceptance criteria close common gaps while leaving some commerce rules unspecified.",
  Expert: "In this seeded reference, the named domain boundaries align with every stored check in its scorecard; this is not proof of a live generated artifact outcome.",
} as const;

const FEATURED_CHECK_IDS = ["cents", "promo-normalize", "shipping-threshold", "quantity-boundaries", "double-submit"];

export type ComparatorRuns = readonly [Run, Run, Run];

export function HeroComparator({ runs }: { runs: ComparatorRuns }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedRun = runs[selectedIndex];
  const featuredChecks = selectedRun.tests.filter((test) => FEATURED_CHECK_IDS.includes(test.id));

  function selectAndFocus(index: number) {
    setSelectedIndex(index);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (selectedIndex + 1) % runs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (selectedIndex - 1 + runs.length) % runs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = runs.length - 1;

    if (nextIndex !== undefined) {
      event.preventDefault();
      selectAndFocus(nextIndex);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-rule-strong bg-card">
      <div className="flex flex-col gap-3 border-b border-rule px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-xs font-medium text-accent">Human-spec gap / seeded references</p>
          <p className="mt-1 text-sm text-ink-soft">These authored reference records hold the stated build and evaluation conditions fixed.</p>
        </div>
        <div className="font-mono text-xs text-ink-muted">hidden survival</div>
      </div>

      <div role="tablist" aria-label="Specification quality" className="grid grid-cols-1 border-b border-rule sm:grid-cols-3">
        {runs.map((run, index) => {
          const active = selectedIndex === index;
          const tabId = `spec-state-${run.id}`;
          return (
            <button
              key={run.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              id={tabId}
              role="tab"
              type="button"
              tabIndex={active ? 0 : -1}
              aria-selected={active}
              aria-controls="spec-evidence-panel"
              onClick={() => setSelectedIndex(index)}
              onKeyDown={handleKeyDown}
              className={cn(
                "relative flex min-h-14 items-center justify-between gap-3 border-rule px-4 py-2.5 text-left transition-colors duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:z-10 sm:min-h-[72px] sm:border-r sm:last:border-r-0 sm:px-5",
                index > 0 && "border-t sm:border-t-0",
                active ? "bg-accent-soft text-ink" : "text-ink-soft hover:bg-white/[0.035] hover:text-ink",
              )}
            >
              <span>
                <span className="block text-sm font-semibold">{STATE_LABELS[run.label]}</span>
                <span className="mt-1 block font-mono text-[11px] text-ink-muted">{run.promptCount} {run.promptCount === 1 ? "prompt" : "prompts"}</span>
              </span>
              <span className={cn("font-mono text-xl font-semibold tabular-nums", active ? "text-accent" : "text-ink")}>{run.score.hiddenPassed}/{run.score.hiddenTotal}</span>
              <span className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-accent transition-opacity duration-[260ms]", active ? "opacity-100" : "opacity-0")} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {STATE_LABELS[selectedRun.label]}: {selectedRun.score.hiddenPassed} of {selectedRun.score.hiddenTotal} hidden checks passed with {selectedRun.promptCount} {selectedRun.promptCount === 1 ? "prompt" : "prompts"}.
      </p>

      <div
        key={selectedRun.id}
        id="spec-evidence-panel"
        role="tabpanel"
        aria-labelledby={`spec-state-${selectedRun.id}`}
        tabIndex={0}
        className="comparator-panel"
      >
        <div className="grid border-b border-rule lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0 border-b border-rule p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{STATE_LABELS[selectedRun.label]}</h3>
              <span className="font-mono text-xs text-ink-muted">seeded reference prompt excerpt</span>
            </div>
            <blockquote className="mt-5 max-w-3xl font-mono text-sm leading-7 text-ink-soft">
              &ldquo;{selectedRun.promptExcerpt}&rdquo;
            </blockquote>
            <p className="mt-6 border-t border-rule pt-5 text-sm leading-6 text-ink-soft">
              <span className="font-semibold text-ink">Seeded diagnosis: </span>{DIAGNOSES[selectedRun.label]}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-ink-muted">hidden survival</p>
                <p className="mt-2 font-mono text-5xl font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">
                  {selectedRun.score.hiddenPassed}<span className="text-2xl text-ink-muted">/{selectedRun.score.hiddenTotal}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-ink-muted">prompt count</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-ink tabular-nums">{selectedRun.promptCount}</p>
              </div>
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-paper" aria-hidden="true">
              <div className="h-full bg-accent transition-[width] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${selectedRun.score.hiddenPassed * 10}%` }} />
            </div>
            <div className="mt-6 border-t border-rule pt-5">
              <p className="font-mono text-xs text-accent">Seeded artifact scenario</p>
              <p className="mt-2 text-sm font-semibold text-ink">{selectedRun.screenshotTitle}</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{selectedRun.screenshotCaption}</p>
              <p className="mt-3 text-xs leading-5 text-ink-muted">Authored reference context, not a captured or live generated artifact.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto]">
          <ul aria-label={`Named ecommerce checks for ${STATE_LABELS[selectedRun.label]}`} className="divide-y divide-rule lg:border-r lg:border-rule">
            {featuredChecks.map((test) => (
              <li key={test.id} className="flex min-h-11 items-center gap-3 px-5 py-2.5 sm:px-6">
                {test.passed ? <Check className="size-4 shrink-0 text-pass" aria-hidden="true" /> : <X className="size-4 shrink-0 text-fail" aria-hidden="true" />}
                <span className="min-w-0 flex-1 text-sm text-ink-soft">{test.label}</span>
                <span className={cn("font-mono text-[11px] font-medium", test.passed ? "text-pass" : "text-fail")}>{test.passed ? "pass" : "miss"}</span>
                <span className="sr-only">{test.passed ? "passed" : "not passed"}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-end p-5 sm:p-6 lg:w-64">
            <Link
              href={`/runs/${selectedRun.id}`}
              className="group inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-md bg-ink px-4 text-sm font-semibold text-paper transition-[background-color,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink/90 active:scale-[0.99]"
            >
              Inspect reference scorecard
              <ArrowUpRight className="size-4 transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
