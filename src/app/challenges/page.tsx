import { AppShell, Eyebrow, Section } from "@/components/promptgolf/chrome";
import { ChallengeCatalog } from "@/components/promptgolf/challenge-catalog";
import { challenges } from "@/lib/promptgolf";

export default function ChallengesPage() {
  return (
    <AppShell>
      <Section className="pb-10 pt-16">
        <Eyebrow>Challenge catalog</Eyebrow>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance text-ink md:text-7xl">Product briefs that punish vague specs.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">Explore artifact-spanning briefs across six engineering domains. Live means runnable today; preview documents an upcoming adapter without pretending it executes.</p>
      </Section>
      <Section className="pt-4">
        <ChallengeCatalog challenges={challenges} />
      </Section>
    </AppShell>
  );
}
