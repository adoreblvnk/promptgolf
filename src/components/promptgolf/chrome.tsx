import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-dvh bg-paper text-ink", className)}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.5] [background-image:linear-gradient(oklch(0.23_0.022_268/0.04)_1px,transparent_1px),linear-gradient(90deg,oklch(0.23_0.022_268/0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="relative z-10">
        <TopNav />
        {children}
        <Footer />
      </div>
    </div>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-transparent">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span className="flex size-8 items-center justify-center rounded-[5px] bg-ink font-mono text-xs font-semibold text-paper">PG</span>
          <span className="font-mono text-sm font-medium tracking-tight text-ink">promptgolf</span>
        </Link>
        <div className="order-3 flex w-full items-center justify-center gap-1 sm:w-auto sm:justify-start md:order-none">
          <NavLink href="/challenges">Challenges</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
        </div>
        <Link
          href="/challenges/mini-checkout-promo-engine"
          className="group inline-flex min-h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-accent/90 active:scale-[0.98]"
        >
          Play demo
          <span className="font-mono transition-transform duration-200 ease-out group-hover:translate-x-0.5">→</span>
        </Link>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-ink/[0.05] hover:text-ink"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 border-t border-rule pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
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
  return <div className={cn("overflow-hidden rounded-lg border border-rule bg-card shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)]", className)}>{children}</div>;
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
  return <div className={cn("rounded-lg border border-rule bg-card p-6 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)]", className)}>{children}</div>;
}
