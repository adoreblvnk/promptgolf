import Link from "next/link";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { LiveRunView } from "@/components/promptgolf/live-run-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LiveRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <Section className="flex flex-col gap-3 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><Link href="/challenges/mini-checkout-promo-engine" className="font-mono text-[11px] text-ink-muted transition-colors hover:text-ink">← Full Stack Ecommerce Checkout</Link><h1 className="mt-1 text-lg font-semibold text-ink">Live submission</h1></div>
          <span className="rounded border border-rule bg-card px-2.5 py-1 font-mono text-[10px] text-ink-muted">run {id}</span>
        </div>
        <LiveRunView id={id} />
      </Section>
    </AppShell>
  );
}
