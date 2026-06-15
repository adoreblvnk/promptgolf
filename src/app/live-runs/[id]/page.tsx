import Link from "next/link";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { LiveRunView } from "@/components/promptgolf/live-run-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LiveRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <Section className="flex flex-col gap-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/challenges/mini-checkout-promo-engine" className="font-mono text-sm text-ink-soft transition-colors hover:text-ink">← Back to challenge</Link>
        </div>
        <LiveRunView id={id} />
      </Section>
    </AppShell>
  );
}
