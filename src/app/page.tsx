import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, ListChecks, LockKeyhole, Target, X } from "lucide-react";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { HeroComparator, type ComparatorRuns } from "@/components/promptgolf/hero-comparator";
import { BlueprintDetailImage, LandingScrollNarrative } from "@/components/promptgolf/landing-scroll-narrative";
import { challenges, runs, type Run } from "@/lib/promptgolf";
import { cn } from "@/lib/utils";

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
    <AppShell className="landing-page overflow-x-clip">
      <main>
        <section className="relative isolate min-h-[calc(100dvh-52px)] overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="landing-hero-art absolute inset-0" aria-hidden="true" />
            <div className="landing-hero-shade absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,oklch(0.145_0.008_265))]" />
          </div>

          <div className="landing-shell flex min-h-[calc(100dvh-52px)] flex-col justify-between py-8 sm:py-10 lg:py-12">
            <div className="max-w-4xl pt-8 sm:pt-14 lg:pt-20">
              <p className="font-mono text-xs font-medium text-accent">PromptGolf / controlled agent benchmark</p>
              <h1 className="mt-5 max-w-4xl text-balance text-[clamp(3.1rem,8vw,5.9rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink">
                LeetCode for agentic prompting.
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-medium leading-8 tracking-[-0.02em] text-ink sm:text-2xl sm:leading-9">
                Same agent. Same task. Different human specification.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft">
                Everyone loves to benchmark models, but after seeing your prompts, I really ought to benchmark y&apos;all instead. Hidden tests reveal whether the generated app survives production behavior.
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
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule-strong bg-paper/40 px-5 text-sm font-semibold text-ink transition-colors duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.05]"
                >
                  Inspect the expert run
                </Link>
              </div>
            </div>

            <div className="grid gap-px border border-rule bg-rule md:grid-cols-2 xl:grid-cols-5">
              <ConstantCell label="Challenge" value="Full Stack Ecommerce Checkout Web App" />
              <ConstantCell label="Builder" value="OpenAI gpt-5.4-mini" />
              <ConstantCell label="Runtime" value="Daytona isolated sandbox" />
              <ConstantCell label="Diagnosis" value="Doubleword after score lock" />
              <ConstantCell label="Behavior" value="Stored EvalSpecs materialized by Playwright" />
            </div>
          </div>
        </section>

        <LandingScrollNarrative />

        <Section className="landing-band py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="landing-kicker">Evidence model</p>
              <h2 className="landing-h2 mt-4">It grades generated behavior, not prompt aesthetics.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
                The hidden-test thesis only works if the benchmark stays honest. Live runs use provider-backed build and preview boundaries; seeded references stay labeled as seeded references.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <EvidencePlate
                icon={<FlaskConical className="size-4" />}
                title="Behavior evidence"
                text="Examples, traces, and properties check observable capabilities."
                image="/images/blueprint-sequence/detail-checkout-artifact.webp"
              />
              <EvidencePlate
                icon={<ListChecks className="size-4" />}
                title="Spec completeness"
                text="Requirement trees connect product claims to testable evidence."
                image="/images/blueprint-sequence/detail-spec-pins.webp"
              />
              <EvidencePlate
                icon={<LockKeyhole className="size-4" />}
                title="Hidden checks"
                text="Private cases reward domain boundaries, not implementation resemblance."
                image="/images/blueprint-sequence/detail-evaluator-rails.webp"
              />
            </div>
          </div>
        </Section>

        <Section className="py-16 sm:py-24">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="landing-kicker">Seeded proof / checkout</p>
              <h2 className="landing-h2 mt-4">One product. Three levels of specification.</h2>
            </div>
            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-base leading-7 text-ink-soft">
                Each seeded reference uses the same checkout challenge. The visible basics stay easy; hidden ecommerce rules create the separation.
              </p>
            </div>
          </div>
          <HeroComparator runs={comparatorRuns} />
        </Section>

        <Section className="py-16 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="grid gap-px border border-rule bg-rule">
                <ScorePath label="Naive" hidden="3/10 hidden" prompt="1 prompt" passed={false} />
                <ScorePath label="Structured" hidden="7/10 hidden" prompt="2 prompts" passed={false} />
                <ScorePath label="Expert" hidden="10/10 hidden" prompt="1 prompt" passed />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="landing-kicker">Final target</p>
              <h2 className="landing-h2 mt-4">Domain knowledge beats vague confidence.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
                A one-shot prompt is not a paragraph. It is a compact engineering spec: assumptions, edge cases, validation, states, and the product rules the hidden checks are waiting for.
              </p>
              <Link
                href={`/challenges/${challenge.slug}`}
                className="group mt-7 inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-ink px-5 text-sm font-semibold text-paper transition-[background-color,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink/90 active:scale-[0.99]"
              >
                Write the spec
                <Target className="size-4 transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-12" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Section>
      </main>
    </AppShell>
  );
}

function ConstantCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper/[0.86] p-4">
      <p className="font-mono text-[11px] text-ink-muted">{label}</p>
      <p className="mt-2 text-sm font-medium leading-5 text-ink">{value}</p>
    </div>
  );
}

function EvidencePlate({ icon, title, text, image }: { icon: ReactNode; title: string; text: string; image: string }) {
  return (
    <article className="bg-card">
      <BlueprintDetailImage src={image} alt="" />
      <div className="border-x border-b border-rule p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="text-accent" aria-hidden="true">{icon}</span>
          {title}
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
      </div>
    </article>
  );
}

function ScorePath({ label, hidden, prompt, passed }: { label: string; hidden: string; prompt: string; passed: boolean }) {
  return (
    <div className="grid gap-4 bg-card p-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">{prompt}</p>
      </div>
      <div className="h-1.5 bg-paper">
        <div className={cn("h-full", passed ? "w-full bg-pass" : label === "Structured" ? "w-[70%] bg-accent" : "w-[30%] bg-fail")} />
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
        {passed ? <Check className="size-4 text-pass" aria-hidden="true" /> : <X className="size-4 text-fail" aria-hidden="true" />}
        {hidden}
      </div>
    </div>
  );
}
