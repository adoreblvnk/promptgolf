"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Circle, LockKeyhole, Search, X } from "lucide-react";
import type { Challenge } from "@/lib/promptgolf/data";
import { cn } from "@/lib/utils";

type Filter = "all" | string;
type SortKey = "number" | "title" | "difficulty" | "acceptance" | "par";
type SortDirection = "asc" | "desc";

const difficultyRank: Record<Challenge["difficulty"], number> = { warmup: 1, intermediate: 2, expert: 3 };
const difficultyTone: Record<Challenge["difficulty"], string> = {
  warmup: "text-pass",
  intermediate: "text-warn",
  expert: "text-fail",
};

export function filterChallenges(challenges: Challenge[], filters: { query: string; category: Filter; difficulty: Filter; status: Filter }) {
  const query = filters.query.trim().toLocaleLowerCase();
  return challenges.filter((challenge) => {
    const searchable = [challenge.title, challenge.subtitle, challenge.categoryLabel, challenge.framework, challenge.artifact].join(" ").toLocaleLowerCase();
    return (!query || searchable.includes(query))
      && (filters.category === "all" || challenge.category === filters.category)
      && (filters.difficulty === "all" || challenge.difficulty === filters.difficulty)
      && (filters.status === "all" || challenge.status === filters.status);
  });
}

function acceptanceFor(challenge: Challenge) {
  return challenge.acceptance ?? null;
}

function parFor(challenge: Challenge) {
  return Math.max(3, challenge.hiddenTeasers.length);
}

export function ChallengeCatalog({ challenges }: { challenges: Challenge[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("all");
  const [difficulty, setDifficulty] = useState<Filter>("all");
  const [status, setStatus] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const categories = useMemo(() => Array.from(new Map(challenges.map((challenge) => [challenge.category, challenge.categoryLabel]))), [challenges]);
  const visible = useMemo(() => {
    const indexed = filterChallenges(challenges, { query, category, difficulty, status }).map((challenge) => ({ challenge, number: challenges.indexOf(challenge) + 1 }));
    const direction = sortDirection === "asc" ? 1 : -1;
    return indexed.sort((a, b) => {
      if (sortKey === "number") return (a.number - b.number) * direction;
      if (sortKey === "title") return a.challenge.title.localeCompare(b.challenge.title) * direction;
      if (sortKey === "difficulty") return (difficultyRank[a.challenge.difficulty] - difficultyRank[b.challenge.difficulty]) * direction;
      if (sortKey === "par") return (parFor(a.challenge) - parFor(b.challenge)) * direction;
      return ((acceptanceFor(a.challenge) ?? -1) - (acceptanceFor(b.challenge) ?? -1)) * direction;
    });
  }, [challenges, query, category, difficulty, status, sortDirection, sortKey]);
  const filtered = Boolean(query || category !== "all" || difficulty !== "all" || status !== "all");
  const liveCount = challenges.filter((challenge) => challenge.status === "live").length;
  const reset = () => { setQuery(""); setCategory("all"); setDifficulty("all"); setStatus("all"); };

  function sortBy(next: SortKey) {
    if (next === sortKey) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(next);
      setSortDirection("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-rule bg-card">
      <div className="flex flex-col gap-3 border-b border-rule p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1 lg:max-w-sm">
          <span className="sr-only">Search challenges</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search problems" className="min-h-9 w-full rounded border border-rule bg-paper pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-warn focus:outline-none focus-visible:ring-2 focus-visible:ring-warn/35" />
        </label>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <CatalogSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: "warmup", label: "Warmup" }, { value: "intermediate", label: "Intermediate" }, { value: "expert", label: "Expert" }]} />
          <CatalogSelect label="Status" value={status} onChange={setStatus} options={[{ value: "live", label: "Live" }, { value: "preview", label: "Preview" }]} />
          <CatalogSelect label="Sort" value={`${sortKey}:${sortDirection}`} onChange={(value) => { const [key, direction] = value.split(":") as [SortKey, SortDirection]; setSortKey(key); setSortDirection(direction); }} options={[{ value: "number:asc", label: "Course order" }, { value: "acceptance:desc", label: "Acceptance" }, { value: "difficulty:asc", label: "Difficulty" }, { value: "par:asc", label: "Par" }]} includeAll={false} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-rule px-3 py-2" aria-label="Problem domains">
        <DomainButton active={category === "all"} onClick={() => setCategory("all")}>All domains</DomainButton>
        {categories.map(([value, label]) => <DomainButton key={value} active={category === value} onClick={() => setCategory(value)}>{label}</DomainButton>)}
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-rule bg-white/[0.018] px-3 font-mono text-[11px] text-ink-muted" aria-live="polite">
        <span>{visible.length} problems · {liveCount} live · {challenges.length - liveCount} in preview</span>
        {filtered && <button type="button" onClick={reset} className="inline-flex min-h-7 items-center gap-1 rounded px-2 text-ink-soft hover:bg-white/[0.05] hover:text-ink"><X className="size-3" /> Reset</button>}
      </div>

      {visible.length ? (
        <div>
          <div className="hidden min-h-9 grid-cols-[40px_minmax(280px,1.6fr)_minmax(150px,.75fr)_110px_90px_90px_80px] items-center gap-3 border-b border-rule bg-white/[0.025] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted lg:grid">
            <span>Status</span>
            <SortButton label="Problem" active={sortKey === "title"} direction={sortDirection} onClick={() => sortBy("title")} />
            <span>Domain</span>
            <span>Artifact</span>
            <SortButton label="Acceptance" active={sortKey === "acceptance"} direction={sortDirection} onClick={() => sortBy("acceptance")} />
            <SortButton label="Difficulty" active={sortKey === "difficulty"} direction={sortDirection} onClick={() => sortBy("difficulty")} />
            <SortButton label="Par" active={sortKey === "par"} direction={sortDirection} onClick={() => sortBy("par")} />
          </div>
          <div className="divide-y divide-rule">
            {visible.map(({ challenge, number }) => <ChallengeRow challenge={challenge} number={number} key={challenge.slug} />)}
          </div>
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <h2 className="text-base font-medium text-ink">No matching problems</h2>
          <p className="mt-1.5 text-sm text-ink-muted">Broaden the search or reset the current filters.</p>
          <button type="button" onClick={reset} className="mt-4 min-h-9 rounded bg-ink px-3.5 text-sm font-medium text-paper">Reset filters</button>
        </div>
      )}
    </div>
  );
}

function CatalogSelect({ label, value, onChange, options, includeAll = true }: { label: string; value: Filter; onChange: (value: string) => void; options: { value: string; label: string }[]; includeAll?: boolean }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-9 w-full rounded border border-rule bg-paper px-2.5 text-[12px] text-ink-soft focus:border-warn focus:outline-none focus-visible:ring-2 focus-visible:ring-warn/35 sm:w-auto" aria-label={label}>
        {includeAll && <option value="all">All {label.toLocaleLowerCase()}</option>}
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function DomainButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn("min-h-8 shrink-0 rounded px-2.5 text-[12px] transition-colors", active ? "bg-white/[0.08] text-ink" : "text-ink-muted hover:bg-white/[0.04] hover:text-ink-soft")}>{children}</button>;
}

function SortButton({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex items-center gap-1 text-left hover:text-ink", active && "text-ink-soft")}>{label}{active && <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span>}</button>;
}

function ChallengeRow({ challenge, number }: { challenge: Challenge; number: number }) {
  const acceptance = acceptanceFor(challenge);
  const locked = challenge.status === "preview";
  return (
    <Link href={`/challenges/${challenge.slug}`} className={cn("group block px-3 transition-colors hover:bg-white/[0.035] focus-visible:outline-offset-[-2px]", locked && "bg-black/[0.05]")}>
      <article className="hidden min-h-[62px] grid-cols-[40px_minmax(280px,1.6fr)_minmax(150px,.75fr)_110px_90px_90px_80px] items-center gap-3 lg:grid">
        <span className="text-ink-muted" title={locked ? "Preview problem" : "Available problem"}>{locked ? <LockKeyhole className="size-3.5" /> : <Circle className="size-3.5 text-pass" />}</span>
        <span className="min-w-0">
          <span className={cn("block truncate text-[13px] font-medium", locked ? "text-ink-soft" : "text-ink group-hover:text-accent")}>{String(number).padStart(2, "0")}. {challenge.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{challenge.subtitle}</span>
        </span>
        <span className="truncate text-[12px] text-ink-soft">{challenge.categoryLabel}</span>
        <span className="font-mono text-[11px] text-ink-muted">{challenge.framework}<br />{challenge.artifact}</span>
        <span className="font-mono text-[12px] tabular-nums text-ink-soft">{acceptance === null ? "—" : `${acceptance}%`}</span>
        <span className={cn("text-[12px] capitalize", difficultyTone[challenge.difficulty])}>{challenge.difficulty}</span>
        <span className="font-mono text-[12px] tabular-nums text-ink-soft">{parFor(challenge)} / {challenge.estimatedMinutes}m</span>
      </article>

      <article className="py-3.5 lg:hidden">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 text-ink-muted">{locked ? <LockKeyhole className="size-3.5" /> : <Circle className="size-3.5 text-pass" />}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className={cn("min-w-0 text-[13px] font-medium leading-5", locked ? "text-ink-soft" : "text-ink")}>{String(number).padStart(2, "0")}. {challenge.title}</h2>
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ink-muted">
              <span>{challenge.categoryLabel}</span>
              <span>{challenge.framework}</span>
              <span className={difficultyTone[challenge.difficulty]}>{challenge.difficulty}</span>
              <span>par {parFor(challenge)}</span>
              <span>{challenge.estimatedMinutes}m</span>
              <span>{acceptance === null ? "preview" : `${acceptance}% accepted`}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
