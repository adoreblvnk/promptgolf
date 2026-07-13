import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { RunTimeline, Scorecard } from "@/components/promptgolf/scorecard";
import { getChallenge, getRun, runs } from "@/lib/promptgolf";

export function generateStaticParams() {
  return runs.map((run) => ({ id: run.id }));
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();
  const challenge = getChallenge(run.challengeSlug);

  return (
    <AppShell>
      <Section className="pb-5 pt-6 sm:pt-8">
        <Link href="/runs" className="inline-flex min-h-8 items-center gap-1.5 rounded text-[12px] text-ink-muted transition-colors hover:text-ink"><ArrowLeft className="size-3.5" /> All submissions</Link>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">Scored · score locked</div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] text-ink">{run.label} prompt scorecard</h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-soft">{challenge?.title}: deterministic results are shown before post-score diagnosis.</p>
          </div>
          <Link href={`/challenges/${run.challengeSlug}`} className="inline-flex min-h-9 items-center justify-center rounded border border-rule px-3 text-[12px] text-ink-soft hover:bg-white/[0.04]">Open problem</Link>
        </div>
      </Section>
      <Section className="py-0"><Scorecard run={run} /></Section>
      <Section className="pt-5"><RunTimeline run={run} /></Section>
    </AppShell>
  );
}
