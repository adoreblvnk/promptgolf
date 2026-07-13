import type { ReactNode } from "react";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { ProductNav } from "@/components/promptgolf/product-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-dvh bg-paper text-ink", className)}>
      <div className="relative z-10">
        <TopNav />
        {children}
        <Footer />
      </div>
    </div>
  );
}

export function WorkbenchShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-[560px] flex-col overflow-hidden bg-paper text-ink">
      <TopNav />
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-rule bg-[#15171b]">
      <nav className="flex min-h-[52px] items-center gap-2 px-3 sm:px-4">
        <Link href="/" className="flex min-h-9 shrink-0 items-center gap-2 rounded px-1.5">
          <span className="flex size-7 items-center justify-center rounded bg-accent font-mono text-[11px] font-semibold text-accent-foreground">PG</span>
          <span className="hidden font-mono text-[13px] font-medium tracking-tight text-ink sm:inline">prompt<span className="text-accent">golf</span></span>
        </Link>
        <span className="h-5 w-px shrink-0 bg-rule" aria-hidden="true" />
        <ProductNav />
        <Link href="/runs/expert-checkout" className="ml-auto hidden min-h-8 shrink-0 items-center gap-2 rounded border border-rule px-2.5 text-xs text-ink-soft hover:bg-white/[0.04] sm:inline-flex">
          <CircleUserRound className="size-3.5" /> Player 01
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-8 max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 border-t border-rule pt-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono">promptgolf · benchmark the spec writers</span>
        <span className="font-mono">good specs survive hidden tests</span>
      </div>
    </footer>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
      <span className="h-px w-6 bg-accent" aria-hidden="true" />
      {children}
    </div>
  );
}

export function Bezel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-md border border-rule bg-card", className)}>{children}</div>;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8", className)}>{children}</section>;
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-rule bg-card p-5">
      <div className="font-mono text-3xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="mt-1.5 text-sm text-ink-soft">{label}</div>
    </div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-md border border-rule bg-card p-6", className)}>{children}</div>;
}
