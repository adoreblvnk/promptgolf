import Link from "next/link";
import { ArrowUpRight, Crown, Medal } from "lucide-react";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { runs } from "@/lib/promptgolf";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const ranked = [...runs].sort((a, b) => b.score.finalScore - a.score.finalScore);

  return (
    <AppShell>
      <Section className="pb-5 pt-8 sm:pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2"><Crown className="size-4 text-warn" /><span className="font-mono text-[11px] text-warn">Clubhouse ranking</span></div>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-ink">Leaderboard</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">Best verified rounds, ranked by passing evidence and prompt efficiency. Runtime does not affect score.</p>
          </div>
          <div className="flex items-center gap-4 rounded border border-rule bg-card px-3 py-2 font-mono text-[11px] text-ink-muted">
            <span>Par <strong className="text-ink">10</strong></span><span>Players <strong className="text-ink">3</strong></span><span>Checks <strong className="text-pass">15</strong></span>
          </div>
        </div>
      </Section>

      <Section className="pb-14 pt-0">
        <div className="overflow-hidden rounded-md border border-rule bg-card">
          <div className="flex min-h-11 items-center justify-between gap-3 border-b border-rule px-3 sm:px-4">
            <div className="flex items-center gap-1">
              <button type="button" className="min-h-8 rounded bg-white/[0.08] px-3 text-[12px] text-ink">Global</button>
              <button type="button" className="min-h-8 rounded px-3 text-[12px] text-ink-muted" disabled>Friends</button>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">Full Stack Ecommerce Checkout</span>
          </div>
          <div className="hidden min-h-9 grid-cols-[52px_minmax(220px,1fr)_100px_90px_90px_90px_90px_76px] items-center gap-3 border-b border-rule bg-white/[0.02] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted md:grid">
            <span>Rank</span><span>Player</span><span>Round</span><span>Hidden</span><span>Strokes</span><span>Handicap</span><span>UX</span><span>Score</span>
          </div>
          <div className="divide-y divide-rule">
            {ranked.map((run, index) => {
              const toPar = run.score.hiddenTotal - run.score.hiddenPassed - 3;
              const handicap = Math.max(0, run.score.hiddenTotal - run.score.hiddenPassed);
              return (
                <Link key={run.id} href={`/runs/${run.id}`} className="group block px-3 transition-colors hover:bg-white/[0.035] sm:px-4">
                  <div className="hidden min-h-[64px] grid-cols-[52px_minmax(220px,1fr)_100px_90px_90px_90px_90px_76px] items-center gap-3 md:grid">
                    <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink-muted">{index === 0 && <Medal className="size-3.5 text-warn" />}#{index + 1}</span>
                    <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-ink group-hover:text-accent">{run.player}</span><span className="mt-0.5 block truncate text-[11px] text-ink-muted">{run.label} spec · verified reference run</span></span>
                    <GolfRound value={toPar} />
                    <span className="font-mono text-[12px] tabular-nums text-ink-soft">{run.score.hiddenPassed}/{run.score.hiddenTotal}</span>
                    <span className="font-mono text-[12px] tabular-nums text-ink-soft">{run.promptCount}</span>
                    <span className="font-mono text-[12px] tabular-nums text-ink-muted">{handicap}</span>
                    <span className="font-mono text-[12px] tabular-nums text-ink-soft">{run.uxScore}/10</span>
                    <span className="flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-ink">{run.score.finalScore}<ArrowUpRight className="size-3 text-ink-muted" /></span>
                  </div>
                  <div className="py-3.5 md:hidden">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 w-7 shrink-0 font-mono text-[12px] text-ink-muted">#{index + 1}</span>
                      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-medium text-ink">{run.player}</span><span className="font-mono text-sm font-semibold text-ink">{run.score.finalScore}</span></div><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-muted"><GolfRound value={toPar} /><span>{run.score.hiddenPassed}/{run.score.hiddenTotal} hidden</span><span>{run.promptCount} stroke{run.promptCount === 1 ? "" : "s"}</span><span>HCP {handicap}</span></div></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-rule bg-white/[0.015] px-4 py-3 text-[11px] leading-5 text-ink-muted">Round is relative to hidden-check par: under-par means fewer missed production checks. Strokes are human prompts; handicap reflects remaining hidden-check gap.</div>
        </div>
      </Section>
    </AppShell>
  );
}

function GolfRound({ value }: { value: number }) {
  const label = value === 0 ? "E" : value > 0 ? `+${value}` : `${value}`;
  return <span className={cn("font-mono text-[12px] font-semibold tabular-nums", value < 0 ? "text-pass" : value > 0 ? "text-fail" : "text-ink-soft")}>{label}</span>;
}
