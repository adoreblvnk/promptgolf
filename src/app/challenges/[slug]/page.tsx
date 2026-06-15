import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, EyeOff, ListChecks } from "lucide-react";
import { AppShell, Eyebrow, GlassCard, Section } from "@/components/promptgolf/chrome";
import { PromptRunner } from "@/components/promptgolf/prompt-runner";
import { challenges, getChallenge } from "@/lib/promptgolf";

export function generateStaticParams() {
  return challenges.map((challenge) => ({ slug: challenge.slug }));
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();

  return (
    <AppShell>
      <Section className="pb-8 pt-16">
        <Eyebrow>{challenge.status} challenge</Eyebrow>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-6xl">{challenge.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">{challenge.publicBrief}</p>
        <div className="mt-7 flex flex-wrap gap-2">
          <span className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">{challenge.difficulty}</span>
          <span className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">{challenge.estimatedMinutes} minute target</span>
          <span className="rounded border border-pass/30 bg-pass-soft px-2.5 py-1 font-mono text-xs text-pass">Live execution</span>
        </div>
      </Section>

      <Section className="pb-10 pt-2">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Write your spec</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Agnes AI builds exactly what you write, the sandbox serves it, and Playwright runs hidden tests against the real app.</p>
          </div>
          <Link href="/leaderboard" className="inline-flex min-h-11 items-center gap-2 font-mono text-sm text-ink-soft transition-colors hover:text-ink">Leaderboard <ArrowRight className="size-4" /></Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-rule bg-card shadow-[0_1px_3px_oklch(0.23_0.022_268/0.06)]">
          <div className="flex items-center gap-2.5 border-b border-rule px-5 py-3">
            <span className="size-2 rounded-full bg-ink-muted" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-ink">Live arena</span>
          </div>
          <div className="p-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Your spec · {challenge.title}</div>
            <PromptRunner challengeSlug={challenge.slug} />
          </div>
        </div>
      </Section>

      <Section className="pb-16 pt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-2.5"><ListChecks className="size-4 text-ink-muted" /><h3 className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Public requirements</h3></div>
            <ul className="mt-4 grid gap-2">
              {challenge.publicRequirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-3 text-sm text-ink-soft">
                  <span className="font-mono text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
                  {requirement}
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2.5"><EyeOff className="size-4 text-accent" /><h3 className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Hidden tests</h3></div>
            <p className="mt-4 text-sm leading-6 text-ink">{challenge.thesis}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {challenge.hiddenTeasers.slice(0, 10).map((teaser) => (
                <span key={teaser} className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">{teaser.split(":")[0]}</span>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs text-ink-muted">Good specs name these explicitly. Vague ones don&apos;t.</p>
          </GlassCard>
        </div>
      </Section>
    </AppShell>
  );
}
