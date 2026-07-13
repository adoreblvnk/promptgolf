import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, FlaskConical, ListChecks } from "lucide-react";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { HeroComparator, type ComparatorRuns } from "@/components/promptgolf/hero-comparator";
import { challenges, runs, type Run } from "@/lib/promptgolf";

const SEEDED_RUN_IDS = ["naive-checkout", "structured-checkout", "expert-checkout"] as const;

function requireSeededRun(id: (typeof SEEDED_RUN_IDS)[number]): Run {
  const run = runs.find((candidate) => candidate.id === id);
  if (!run) throw new Error(`Landing comparator requires seeded run "${id}".`);
  return run;
}

export default function Home() {
  const challenge = challenges.find((item) => item.slug === "mini-checkout-promo-engine") ?? challenges[0];
  const comparatorRuns: ComparatorRuns = [
    requireSeededRun(SEEDED_RUN_IDS[0]),
    requireSeededRun(SEEDED_RUN_IDS[1]),
    requireSeededRun(SEEDED_RUN_IDS[2]),
  ];

  return (
    <AppShell className="overflow-x-clip">
      <main>
        <Section className="pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-end lg:gap-16">
            <div>
              <p className="font-mono text-xs font-medium text-accent">PromptGolf / controlled agent benchmark</p>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-[5rem]">
                Same agent. Same task. Different specification.
              </h1>
              <p className="mt-7 max-w-2xl text-xl font-medium leading-8 tracking-[-0.02em] text-ink-soft sm:text-2xl sm:leading-9">
                AI made building abundant. Reliable judgment is still scarce.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft">
                PromptGolf holds the machine constant and changes the human-written spec. Hidden tests reveal whether the generated product only looks complete or survives production behavior.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/challenges/${challenge.slug}`}
                  className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-accent px-5 text-sm font-semibold text-paper transition-[background-color,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-accent/90 active:scale-[0.99]"
                >
                  Play the checkout challenge
                  <ArrowRight className="size-4 transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/runs/expert-checkout"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule-strong px-5 text-sm font-semibold text-ink transition-colors duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.04]"
                >
                  Inspect the expert run
                </Link>
              </div>
            </div>

            <aside aria-label="Held-constant benchmark conditions" className="border-y border-rule-strong">
              <p className="border-b border-rule py-3 font-mono text-xs font-medium text-accent">Held constant</p>
              <ConstantRow label="Challenge" value="Full Stack Ecommerce Checkout Web App" />
              <ConstantRow label="Builder" value="OpenAI gpt-5.4-mini" />
              <ConstantRow label="Evaluator" value="Stored EvalSpecs + Playwright behavior" />
            </aside>
          </div>
        </Section>

        <Section className="pb-16 pt-4 sm:pb-24 sm:pt-6">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-balance text-ink sm:text-4xl">One product. Three levels of specification.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">Each seeded reference pairs an authored checkout scenario with named production checks.</p>
            </div>
            <p className="max-w-sm font-mono text-xs leading-5 text-ink-muted sm:text-right">Structure is teachable. Domain judgment creates separation.</p>
          </div>
          <HeroComparator runs={comparatorRuns} />
        </Section>

        <Section className="border-t border-rule pb-10 pt-14 sm:pb-16 sm:pt-16">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Evidence, not prompt aesthetics.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">The score follows observable product behavior. Methodology supports the judgment after the comparison makes the gap visible.</p>
            </div>
            <div className="divide-y divide-rule border-y border-rule">
              <MethodRow icon={<FlaskConical className="size-4" />} title="Behavior evidence" text="Examples, state-machine traces, and properties test positive capabilities." />
              <MethodRow icon={<ListChecks className="size-4" />} title="Spec completeness" text="Requirement trees connect product claims to observable evidence." />
              <MethodRow icon={<Boxes className="size-4" />} title="Artifact adapters" text="Framework output maps to one canonical capability protocol." />
            </div>
          </div>
        </Section>
      </main>
    </AppShell>
  );
}

function ConstantRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-4 last:border-b-0">
      <span className="font-mono text-xs text-ink-muted">{label}</span>
      <span className="text-sm font-medium leading-5 text-ink">{value}</span>
    </div>
  );
}

function MethodRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[1.1fr_1.4fr] sm:items-start sm:gap-8">
      <div className="flex items-center gap-3 text-sm font-semibold text-ink">
        <span className="text-accent" aria-hidden="true">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-6 text-ink-soft">{text}</p>
    </div>
  );
}
