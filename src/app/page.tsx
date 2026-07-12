import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, FlaskConical, ListChecks } from "lucide-react";
import { AppShell, Eyebrow, Section } from "@/components/promptgolf/chrome";
import { HeroComparator, type ComparatorSide } from "@/components/promptgolf/hero-comparator";
import { challenges, runs, type Run } from "@/lib/promptgolf";

const toSide = (run: Run): ComparatorSide => ({
  label: run.label,
  score: run.score.finalScore,
  hiddenPassed: run.score.hiddenPassed,
  hiddenTotal: run.score.hiddenTotal,
  promptCount: run.promptCount,
});

export default function Home() {
  const ranked = [...runs].sort((a, b) => b.score.finalScore - a.score.finalScore);
  const naiveRun = runs.find((run) => run.id === "naive-checkout") ?? ranked[ranked.length - 1];
  const expertRun = runs.find((run) => run.id === "expert-checkout") ?? ranked[0];
  const challenge = challenges[0];

  return (
    <AppShell className="overflow-hidden [background-image:url('/promptgolf-hero-bg.png')] [background-position:center] [background-repeat:no-repeat] [background-size:cover]">
      <Section className="relative grid items-center gap-12 overflow-hidden pb-14 pt-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-paper via-paper/72 to-paper/18" />
        <div className="relative z-10">
          <Eyebrow>Live benchmark</Eyebrow>
          <h1 className="mt-7 max-w-xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-7xl">
            Your models don&apos;t have a skill issue. <span className="text-accent">You do.</span>
          </h1>
          <p className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-accent sm:text-4xl">Start promptmaxxing.</p>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink-soft">
            PromptGolf benchmarks the spec writers, not the models. An agent builds a real project; positive capability evidence shows whether your spec survives reality.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/challenges/${challenge.slug}`}
              className="group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-md bg-accent px-6 font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-accent/90 active:scale-[0.99]"
            >
              Try the challenge <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule bg-card px-6 font-medium text-ink transition-colors duration-200 ease-out hover:bg-ink/[0.04]"
            >
              View leaderboard
            </Link>
          </div>
        </div>
        <div className="relative z-10">
          <HeroComparator naive={toSide(naiveRun)} expert={toSide(expertRun)} />
        </div>
      </Section>

      <Section className="pb-16 pt-12">
        <div className="overflow-hidden rounded-lg border border-rule bg-card">
          <div className="grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
            <PipeStep icon={<FlaskConical className="size-5" />} step="01" title="Behavior evidence" text="Examples, state-machine traces, and property checks observe what the built product can do." />
            <PipeStep icon={<ListChecks className="size-5" />} step="02" title="Spec completeness" text="Requirement trees connect each positive product claim to observable evidence." />
            <PipeStep icon={<Boxes className="size-5" />} step="03" title="Artifact adapters" text="Framework-aware discovery maps web, API, and CLI outputs to one capability protocol." />
          </div>
        </div>
      </Section>
    </AppShell>
  );
}

function PipeStep({ icon, step, title, text }: { icon: ReactNode; step: string; title: string; text: string }) {
  return (
    <div className="p-6 md:p-7">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-md bg-ink text-paper">{icon}</div>
        <span className="font-mono text-xs text-ink-muted">{step}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2.5 text-sm leading-6 text-ink-soft">{text}</p>
    </div>
  );
}
