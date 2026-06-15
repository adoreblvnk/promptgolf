"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "naive" | "expert";

export type ComparatorSide = {
  label: string;
  score: number;
  hiddenPassed: number;
  hiddenTotal: number;
  promptCount: number;
};

const HIDDEN = [
  { id: "cents", label: "cents math", naiveFails: true, reason: "$140.18 ≠ 140.17" },
  { id: "promo-normalize", label: "promo normalize", naiveFails: true, reason: "spaces + case" },
  { id: "discount-floor", label: "discount floor", naiveFails: true, reason: "below zero" },
  { id: "shipping-threshold", label: "shipping threshold", naiveFails: true, reason: "wrong base" },
  { id: "out-of-stock", label: "out-of-stock block", naiveFails: true, reason: "ships anyway" },
  { id: "double-submit", label: "double-submit lock", naiveFails: true, reason: "2 orders" },
  { id: "quantity-boundaries", label: "quantity bounds", naiveFails: true, reason: "qty → −1" },
  { id: "invalid-code", label: "invalid code error", naiveFails: false, reason: "" },
  { id: "loading-error", label: "loading + error", naiveFails: false, reason: "" },
  { id: "mobile-a11y", label: "mobile + a11y", naiveFails: false, reason: "" },
] as const;

export function HeroComparator({ naive, expert }: { naive: ComparatorSide; expert: ComparatorSide }) {
  const [variant, setVariant] = useState<Variant>("naive");
  const side = variant === "naive" ? naive : expert;
  const isNaive = variant === "naive";
  const total = HIDDEN.length;

  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-card shadow-[0_1px_3px_oklch(0.23_0.022_268/0.06)]">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-ink">full-stack checkout · ecommerce</span>
        <span className="font-mono text-xs text-ink-muted">par {total}</span>
      </div>

      <div role="tablist" aria-label="Prompt quality" className="grid grid-cols-2 border-b border-rule">
        {(["naive", "expert"] as const).map((value) => {
          const active = variant === value;
          const accentBar = value === "naive" ? "bg-accent" : "bg-pass";
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setVariant(value)}
              className={cn(
                "relative min-h-12 px-4 font-mono text-sm transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                value === "naive" ? "border-r border-rule" : "",
                active ? "bg-paper font-medium text-ink" : "text-ink-muted hover:bg-ink/[0.03] hover:text-ink-soft",
              )}
            >
              {value === "naive" ? "naive prompt" : "expert spec"}
              <span className={cn("absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-200 ease-out", accentBar, active ? "opacity-100" : "opacity-0")} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="flex items-end justify-between gap-4 border-b border-rule px-5 py-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">score</div>
          <div className="mt-1 font-mono text-5xl font-semibold leading-none tracking-tight text-ink tabular-nums">{side.score}</div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">hidden</div>
            <div className="mt-1 font-mono text-xl font-medium tabular-nums text-ink">
              {side.hiddenPassed}<span className="text-ink-muted">/{side.hiddenTotal}</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">strokes</div>
            <div className="mt-1 font-mono text-xl font-medium tabular-nums text-ink">{side.promptCount}</div>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-rule" aria-label={`Hidden test results for ${side.label}`}>
        {HIDDEN.map((row) => {
          const failed = isNaive && row.naiveFails;
          return (
            <li key={row.id} className={cn("flex items-center gap-3 px-5 py-2 transition-colors duration-200 ease-out motion-reduce:transition-none", failed ? "bg-accent-soft" : "")}>
              <span className={cn("w-3 shrink-0 text-center font-mono text-sm", failed ? "text-accent-strong" : "text-pass")} aria-hidden="true">
                {failed ? "✗" : "✓"}
              </span>
              <span className={cn("min-w-0 flex-1 truncate font-mono text-sm", failed ? "text-ink" : "text-ink-soft")}>{row.label}</span>
              {failed && <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-accent-strong">{row.reason}</span>}
              {failed ? (
                <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">fail</span>
              ) : (
                <span className="w-10 shrink-0 text-right font-mono text-[11px] font-medium uppercase tracking-wider text-pass">pass</span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="border-t border-rule px-5 py-3 text-xs leading-5 text-ink-muted">
        {isNaive
          ? "Looks done in the browser. Seven hidden checks fail because the prompt never named the product rules."
          : "Same challenge. The spec encodes the domain quirks, so the app survives reality."}
      </p>
    </div>
  );
}
