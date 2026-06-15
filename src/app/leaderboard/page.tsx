import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AppShell, Eyebrow, GlassCard, Section } from "@/components/promptgolf/chrome";
import { RunPreview } from "@/components/promptgolf/scorecard";
import { runs } from "@/lib/promptgolf";

export default function LeaderboardPage() {
  const ranked = [...runs].sort((a, b) => b.score.finalScore - a.score.finalScore);

  return (
    <AppShell>
      <Section className="grid items-center gap-10 pb-10 pt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
        <div>
          <Eyebrow>Leaderboard</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">Fewer prompts. More passing tests.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">The demo ranks prompt quality by public checks, hidden domain checks, UX/style, and prompt efficiency. Runtime is intentionally not part of scoring.</p>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-rule bg-card shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)]">
          <div className="relative aspect-[3/2]">
            <Image
              src="/promptgolf-scorecard-bg.png"
              alt="Illustration of a generated app turning into scored prompt evaluation cards"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 38vw, 100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-paper/65 via-transparent to-transparent" aria-hidden="true" />
        </div>
      </Section>

      <Section className="py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {ranked.map((run, index) => <RunPreview key={run.id} run={run} rank={index + 1} />)}
        </div>
      </Section>

      <Section className="pt-8">
        <GlassCard>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Detailed ranking</h2>
          <div className="mt-6 overflow-hidden rounded-md border border-rule">
            {ranked.map((run, index) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="grid gap-4 border-b border-rule bg-card p-5 transition-colors duration-200 ease-out last:border-b-0 hover:bg-paper md:grid-cols-[56px_1fr_110px_110px_110px_72px] md:items-center"
              >
                <div className="font-mono text-2xl font-semibold tabular-nums text-ink-muted">#{index + 1}</div>
                <div>
                  <div className="font-medium text-ink">{run.player}</div>
                  <div className="mt-1 line-clamp-1 text-sm text-ink-soft">{run.promptExcerpt}</div>
                </div>
                <Cell label="public" value={`${run.score.publicPassed}/${run.score.publicTotal}`} />
                <Cell label="hidden" value={`${run.score.hiddenPassed}/${run.score.hiddenTotal}`} />
                <Cell label="prompts" value={`${run.promptCount}`} />
                <div className="flex items-center gap-2 font-mono text-xl font-semibold tabular-nums text-ink">
                  {run.score.finalScore}
                  <ArrowRight className="size-4 text-ink-muted" />
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </Section>
    </AppShell>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 font-mono font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
