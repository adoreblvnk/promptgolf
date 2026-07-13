"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenCheck, FlaskConical, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/challenges", label: "Problems", mobileLabel: "Problems", icon: BookOpenCheck },
  { href: "/leaderboard", label: "Leaderboard", mobileLabel: "Leaders", icon: Trophy },
  { href: "/runs", label: "Runs", mobileLabel: "Runs", icon: BarChart3 },
  { href: "/methodology", label: "Methodology", mobileLabel: "Method", icon: FlaskConical },
];

export function ProductNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-0.5 sm:flex-none sm:justify-start">
      {links.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/runs" && pathname.startsWith("/live-runs/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded px-1 text-[13px] transition-colors sm:gap-1.5 sm:px-2.5",
              active ? "bg-white/[0.07] text-ink" : "text-ink-soft hover:bg-white/[0.04] hover:text-ink",
            )}
          >
            <Icon className="hidden size-3.5 sm:block" aria-hidden="true" />
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
