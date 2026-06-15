import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cpu, Gauge } from "lucide-react";
import { AppShell, Eyebrow, GlassCard, Section } from "@/components/promptgolf/chrome";
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <Eyebrow>Run report</Eyebrow>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">{run.label} prompt scorecard</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-soft">{challenge?.title}: PromptGolf compares visible app completion against hidden product-engineering checks.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <GlassCard className="p-5"><div className="flex items-center gap-3 text-sm text-ink"><Cpu className="size-4 text-accent" /> <span className="font-mono">{run.provider} · {run.model}</span></div><p className="mt-3 text-sm text-ink-soft">Default Codex path uses unlimited ChatGPT/Codex usage, separate from low OpenAI credits. Live checkout generation uses Kimi/Moonshot.</p></GlassCard>
            <GlassCard className="p-5"><div className="flex items-center gap-3 text-sm text-ink"><Gauge className="size-4 text-ink-muted" /> <span className="font-mono">{run.gateway}</span></div><p className="mt-3 text-sm text-ink-soft">TokenRouter handles routed evaluator drafts and feedback posture; deterministic Playwright checks decide the score.</p></GlassCard>
          </div>
        </div>
      </Section>
      <Section className="py-8"><Scorecard run={run} /></Section>
      <Section className="pt-8"><RunTimeline run={run} /></Section>
    </AppShell>
  );
}
