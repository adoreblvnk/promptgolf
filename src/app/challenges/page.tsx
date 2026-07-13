import { AppShell, Section } from "@/components/promptgolf/chrome";
import { ChallengeCatalog } from "@/components/promptgolf/challenge-catalog";
import { challenges } from "@/lib/promptgolf";

export default function ChallengesPage() {
  const liveChallenges = challenges.filter((challenge) => challenge.status === "live");
  const activeHiddenChecks = liveChallenges.reduce((total, challenge) => total + challenge.hiddenTeasers.length, 0);

  return (
    <AppShell>
      <Section className="pb-5 pt-8 sm:pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink">Problem set</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">Benchmark your software specs against visible requirements and production-grade hidden checks.</p>
          </div>
          <div className="flex items-center gap-4 rounded border border-rule bg-card px-3 py-2 font-mono text-[11px] text-ink-muted">
            <span><strong className="text-pass">{liveChallenges.length}</strong> live</span>
            <span><strong className="text-ink">{challenges.length}</strong> problems</span>
            <span><strong className="text-accent">{activeHiddenChecks}</strong> hidden checks in play</span>
          </div>
        </div>
      </Section>
      <Section className="pb-14 pt-0">
        <ChallengeCatalog challenges={challenges} />
      </Section>
    </AppShell>
  );
}
