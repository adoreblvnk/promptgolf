import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { AppShell, Section } from "@/components/promptgolf/chrome";
import { runs } from "@/lib/promptgolf";

export default function RunsPage() {
  const recent = [...runs].sort((a, b) => b.score.finalScore - a.score.finalScore);
  return (
    <AppShell>
      <Section className="pb-5 pt-8 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink">Submissions</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">Verified reference rounds. Live provider-backed runs appear at their unique run URL during execution.</p>
      </Section>
      <Section className="pb-14 pt-0">
        <div className="overflow-hidden rounded-md border border-rule bg-card">
          <div className="hidden min-h-9 grid-cols-[minmax(220px,1fr)_120px_110px_110px_100px_80px] items-center gap-3 border-b border-rule bg-white/[0.02] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted sm:grid">
            <span>Submission</span><span>Status</span><span>Hidden</span><span>Prompts</span><span>Model</span><span>Score</span>
          </div>
          <div className="divide-y divide-rule">
            {recent.map((run) => <Link href={`/runs/${run.id}`} key={run.id} className="group grid gap-2 px-4 py-3.5 transition-colors hover:bg-white/[0.035] sm:min-h-[62px] sm:grid-cols-[minmax(220px,1fr)_120px_110px_110px_100px_80px] sm:items-center sm:gap-3 sm:py-0"><div className="min-w-0"><span className="block truncate text-[13px] font-medium text-ink group-hover:text-accent">{run.label} · {run.player}</span><span className="mt-0.5 block truncate text-[11px] text-ink-muted">Full Stack Ecommerce Checkout Web App</span></div><span className="inline-flex w-fit items-center gap-1.5 text-[11px] text-pass"><CheckCircle2 className="size-3.5" />Accepted</span><span className="font-mono text-[11px] text-ink-soft">{run.score.hiddenPassed}/{run.score.hiddenTotal} hidden</span><span className="font-mono text-[11px] text-ink-soft">{run.promptCount} stroke{run.promptCount === 1 ? "" : "s"}</span><span className="font-mono text-[10px] text-ink-muted">gpt-5.4-mini</span><span className="flex items-center gap-1 font-mono text-sm font-semibold text-ink">{run.score.finalScore}<ArrowUpRight className="size-3 text-ink-muted" /></span></Link>)}
          </div>
        </div>
      </Section>
    </AppShell>
  );
}
