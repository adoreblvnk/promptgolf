import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell, Eyebrow, Section } from "@/components/promptgolf/chrome";
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
      <Section className="pb-10 pt-16">
        <Link href={`/challenges/${run.challengeSlug}`} className="inline-flex min-h-11 items-center gap-2 font-mono text-sm text-ink-soft transition-colors hover:text-ink"><ArrowLeft className="size-4" /> Back to challenge</Link>
        <div className="mt-8">
          <Eyebrow>Run report</Eyebrow>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">{run.label} prompt scorecard</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-soft">{challenge?.title}: PromptGolf compares visible app completion against hidden product-engineering checks.</p>
        </div>
      </Section>
      <Section className="py-8"><Scorecard run={run} /></Section>
      <Section className="pt-8"><RunTimeline run={run} /></Section>
    </AppShell>
  );
}
