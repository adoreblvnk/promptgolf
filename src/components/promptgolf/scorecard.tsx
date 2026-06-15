import Link from "next/link";
import { Check, CircleDashed, LoaderCircle, Trophy, X } from "lucide-react";
import { Bezel, GlassCard } from "@/components/promptgolf/chrome";
import type { Run } from "@/lib/promptgolf";
import { cn } from "@/lib/utils";

export function ScorePill({ run }: { run: Run }) {
  const score = run.score.finalScore;
  return (
    <div className="flex items-center gap-3 rounded-md border border-rule bg-paper p-1.5 pr-4">
      <div className="flex size-12 items-center justify-center rounded bg-ink font-mono text-lg font-semibold tabular-nums text-paper">{score}</div>
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">score</div>
        <div className="font-mono text-sm text-ink-soft">{run.score.hiddenPassed}/{run.score.hiddenTotal} hidden · {run.promptCount} prompt{run.promptCount === 1 ? "" : "s"}</div>
      </div>
    </div>
  );
}

export function RunPreview({ run, rank }: { run: Run; rank?: number }) {
  return (
    <Link href={`/runs/${run.id}`} className="group block">
      <div className="h-full rounded-lg border border-rule bg-card p-6 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)] transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-rule-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">{rank ? `#${rank}` : run.label}</div>
            <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{run.player}</h3>
          </div>
          <div className="flex size-10 items-center justify-center rounded bg-ink font-mono text-sm font-semibold tabular-nums text-paper">{run.score.finalScore}</div>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-soft">{run.promptExcerpt}</p>
        <div className="mt-6 grid grid-cols-3 divide-x divide-rule overflow-hidden rounded-md border border-rule">
          <MiniMetric value={`${run.score.publicPassed}/${run.score.publicTotal}`} label="public" />
          <MiniMetric value={`${run.score.hiddenPassed}/${run.score.hiddenTotal}`} label="hidden" />
          <MiniMetric value={`${run.uxScore}/10`} label="ux" />
        </div>
      </div>
    </Link>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-paper p-3 text-center">
      <div className="font-mono text-base font-semibold tabular-nums text-ink">{value}</div>
      <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">{label}</div>
    </div>
  );
}

export function Scorecard({ run }: { run: Run }) {
  const groups = [
    { key: "public", title: "Public tests", passed: run.score.publicPassed, total: run.score.publicTotal },
    { key: "hidden", title: "Hidden tests", passed: run.score.hiddenPassed, total: run.score.hiddenTotal },
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <GlassCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent">{run.provider} · {run.model}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink">{run.player}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">{run.promptExcerpt}</p>
          </div>
          <ScorePill run={run} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.key} className="rounded-md border border-rule bg-paper p-5">
              <div className="flex items-center justify-between">
                <div className="font-medium text-ink">{group.title}</div>
                <div className="font-mono text-sm tabular-nums text-ink-soft">{group.passed}/{group.total}</div>
              </div>
              <div
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-rule"
                role="progressbar"
                aria-label={`${group.title} passed`}
                aria-valuemin={0}
                aria-valuemax={group.total}
                aria-valuenow={group.passed}
              >
                <div className="h-full rounded-full bg-ink" style={{ width: `${(group.passed / group.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <ul className="mt-6 divide-y divide-rule overflow-hidden rounded-md border border-rule">
          {run.tests.map((test) => (
            <li key={test.id} className={cn("flex items-start gap-3 px-4 py-3", test.passed ? "bg-card" : "bg-accent-soft")}>
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", test.passed ? "bg-pass-soft text-pass" : "bg-accent text-paper")}>
                {test.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{test.label}</span>
                  <span className="rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">{test.category}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{test.note}</p>
              </div>
              <span className={cn("shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider", test.passed ? "text-pass" : "text-accent-strong")}>
                {test.passed ? "pass" : "fail"}
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <div className="space-y-6">
        <GeneratedAppCard run={run} />
        <GlassCard>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted"><Trophy className="size-4 text-warn" /> Failure categories</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {run.failureCategories.map((category) => <span key={category} className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">{category}</span>)}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function GeneratedAppCard({ run }: { run: Run }) {
  return (
    <Bezel>
      <div className="p-5">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div>
            <div className="font-medium text-ink">{run.screenshotTitle}</div>
            <div className="font-mono text-xs text-ink-muted">generated checkout preview</div>
          </div>
          <div className="flex gap-1.5" aria-hidden="true"><i className="size-2.5 rounded-full bg-fail" /><i className="size-2.5 rounded-full bg-warn" /><i className="size-2.5 rounded-full bg-pass" /></div>
        </div>
        <div className="mt-5 rounded-md border border-rule bg-paper p-5">
          <div className="flex items-center justify-between"><div className="text-lg font-semibold text-ink">Checkout</div><div className="rounded bg-pass-soft px-2.5 py-1 font-mono text-xs text-pass">PROMO15</div></div>
          <div className="mt-5 space-y-2">
            {["Canvas Tote", "Field Notebook", "USB-C Dock"].map((item, idx) => <div key={item} className="flex justify-between rounded border border-rule bg-card p-3 text-sm text-ink-soft"><span>{item}</span><span className="font-mono text-ink-muted">x{idx + 1}</span></div>)}
          </div>
          <div className="mt-5 space-y-2 border-t border-rule pt-4 text-sm text-ink-soft"><div className="flex justify-between"><span>Subtotal</span><span className="font-mono">$152.00</span></div><div className="flex justify-between"><span>Discount</span><span className="font-mono">-$22.80</span></div><div className="flex justify-between font-medium text-ink"><span>Total</span><span className="font-mono">$140.18</span></div></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-soft">{run.screenshotCaption}</p>
      </div>
    </Bezel>
  );
}

function StageIcon({ status }: { status: Run["stages"][number]["status"] }) {
  if (status === "complete") return <Check className="size-4" aria-hidden="true" />;
  if (status === "running") return <LoaderCircle className="size-4" aria-hidden="true" />;
  return <CircleDashed className="size-4" aria-hidden="true" />;
}

export function RunTimeline({ run }: { run: Run }) {
  return (
    <GlassCard>
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Sandbox/run timeline</h2>
      <ol className="mt-6 divide-y divide-rule overflow-hidden rounded-md border border-rule" aria-label="Sandbox run stages">
        {run.stages.map((stage) => (
          <li key={stage.label} className="flex gap-4 bg-card px-4 py-4" aria-label={`${stage.label}: ${stage.status}. ${stage.detail}`}>
            <div className={cn("mt-1 flex size-8 shrink-0 items-center justify-center rounded border", stage.status === "complete" ? "border-pass/30 bg-pass-soft text-pass" : stage.status === "running" ? "border-warn/35 bg-warn-soft text-warn" : "border-rule bg-paper text-ink-muted")}>
              <StageIcon status={stage.status} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-ink">{stage.label}</div>
                <span className="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-xs text-ink-muted">{stage.status}</span>
              </div>
              <div className="mt-1 text-sm leading-6 text-ink-soft">{stage.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
