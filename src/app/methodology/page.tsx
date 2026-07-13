import { Boxes, FlaskConical, ListChecks } from "lucide-react";
import { AppShell, Eyebrow, Section } from "@/components/promptgolf/chrome";

const pillars = [
  { icon: FlaskConical, title: "Behavior", body: "Examples prove named outcomes. State-machine traces exercise lifecycles. Property and fuzz cases cover broad input spaces without prescribing an implementation." },
  { icon: ListChecks, title: "Spec completeness", body: "A requirement tree connects every scored capability to the public task, a domain rule, and the evidence needed to satisfy it." },
  { icon: Boxes, title: "Artifact adapters", body: "Framework-aware adapters build and start the submitted workspace, then expose its routes, controls, outputs, and commands through one canonical protocol." },
];

export default function MethodologyPage() {
  return (
    <AppShell>
      <Section className="pb-10 pt-16">
        <Eyebrow>Evaluation methodology</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">Capability evidence, not code resemblance.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-soft">PromptGolf asks one question: did the submitted spec cause an agent to build the requested product capabilities? Every point must trace to positive, observable evidence.</p>
      </Section>

      <Section className="py-8">
        <div className="overflow-hidden rounded-lg border border-rule bg-card">
          <div className="grid divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article className="p-6 lg:p-8" key={title}>
                <Icon className="size-5 text-accent" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink">How a challenge earns trust</h2>
          <ol className="mt-6 divide-y divide-rule border-y border-rule">
            {["Write a public requirement tree and domain rules before evaluator code.", "Materialize each leaf as an observable example, state transition, property, or adapter capability.", "Run naive, structured, and expert specs repeatedly through the same generation and sandbox path.", "Keep evidence that consistently separates omitted requirements from specified capabilities; revise ambiguous checks."].map((step, index) => (
              <li className="flex gap-5 py-5 text-sm leading-6 text-ink-soft" key={step}><span className="font-mono text-accent">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>
            ))}
          </ol>
        </div>
        <aside className="rounded-lg border border-rule bg-card p-6">
          <h2 className="text-lg font-semibold text-ink">What scores</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">Rendered behavior, valid state transitions, requirement coverage, runnable framework metadata, accessibility, and usable output across supported viewports.</p>
          <h2 className="mt-7 text-lg font-semibold text-ink">Fair in hindsight</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">Hidden checks should encode production knowledge a competent practitioner would recognize: money precision, concurrency, permissions, normalization, recovery, boundaries, and failure states.</p>
        </aside>
      </Section>

      <Section className="pt-8">
        <div className="grid overflow-hidden rounded-lg border border-rule bg-card lg:grid-cols-2 lg:divide-x lg:divide-rule">
          <div className="border-b border-rule p-6 lg:border-b-0 lg:p-8">
            <h2 className="text-xl font-semibold text-ink">Public contract, private cases</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Players can inspect the requirement tree, evidence methods, capability vocabulary, scoring weights, and run results. Hidden evaluator source and test cases remain outside the builder workspace so the artifact must satisfy the capability rather than memorize the judge.</p>
          </div>
          <div className="p-6 lg:p-8">
            <h2 className="text-xl font-semibold text-ink">Outcome policy</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">PromptGolf does not use mutation or negative testing, implementation resemblance, source layout, fixed signatures where valid alternatives exist, CSS fingerprints, preferred methods, or model-specific prompt wording. Invalid and failure-state behavior can still earn positive evidence when the brief requires that observable capability.</p>
          </div>
        </div>
      </Section>
    </AppShell>
  );
}
