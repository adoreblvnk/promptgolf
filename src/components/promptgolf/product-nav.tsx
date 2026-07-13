"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenCheck, FlaskConical, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/challenges", label: "Problems", icon: BookOpenCheck },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/runs", label: "Runs", icon: BarChart3 },
  { href: "/methodology", label: "Methodology", icon: FlaskConical },
];

export function ProductNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto" aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/runs" && pathname.startsWith("/live-runs/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-1 rounded px-2 text-[13px] transition-colors sm:gap-1.5 sm:px-2.5",
              active ? "bg-white/[0.07] text-ink" : "text-ink-muted hover:bg-white/[0.04] hover:text-ink-soft",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className={cn(label === "Methodology" && "hidden md:inline")}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
