import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole } from "lucide-react";
import { AppShell, Eyebrow, Section } from "@/components/promptgolf/chrome";
import { challenges, getRunsForChallenge } from "@/lib/promptgolf";

export default function ChallengesPage() {
  return (
    <AppShell>
      <Section className="pb-10 pt-16">
        <Eyebrow>Challenge catalog</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">Product briefs that punish vague specs.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">Each challenge exposes a normal public brief. The hidden evaluator checks the messy product and engineering behavior good specs should include.</p>
      </Section>
      <Section className="pt-4">
        <div className="grid gap-5 lg:grid-cols-2">
          {challenges.map((challenge) => {
            const challengeRuns = getRunsForChallenge(challenge.slug);
            const best = challengeRuns[0];
            return (
              <Link href={`/challenges/${challenge.slug}`} key={challenge.slug} className="group block">
                <div className="h-full rounded-lg border border-rule bg-card p-6 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)] transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-rule-strong">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-ink px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider text-paper">{challenge.status}</span>
                    <span className="rounded border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft">{challenge.difficulty}</span>
                    <span className="inline-flex items-center gap-1 rounded border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft"><Clock className="size-3" /> {challenge.estimatedMinutes} min</span>
                  </div>
                  <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-ink">{challenge.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">{challenge.subtitle}</p>
                  <div className="mt-6 rounded-md border border-rule bg-paper p-5">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted"><LockKeyhole className="size-3.5 text-accent" /> Hidden evaluator teaser</div>
                    <p className="mt-3 text-sm leading-6 text-ink-soft">{challenge.thesis}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-rule pt-5 text-sm">
                    <span className="font-mono text-ink-muted">Best seeded score: {best ? best.score.finalScore : "preview"}</span>
                    <span className="inline-flex items-center gap-2 font-medium text-ink group-hover:text-accent">Open <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>
    </AppShell>
  );
}
