"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole, Search, X } from "lucide-react";
import type { Challenge } from "@/lib/promptgolf/data";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

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

export function ChallengeCatalog({ challenges }: { challenges: Challenge[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("all");
  const [difficulty, setDifficulty] = useState<Filter>("all");
  const [status, setStatus] = useState<Filter>("all");
  const categories = useMemo(() => Array.from(new Map(challenges.map((challenge) => [challenge.category, challenge.categoryLabel]))), [challenges]);
  const visible = useMemo(() => filterChallenges(challenges, { query, category, difficulty, status }), [challenges, query, category, difficulty, status]);
  const filtered = Boolean(query || category !== "all" || difficulty !== "all" || status !== "all");
  const reset = () => { setQuery(""); setCategory("all"); setDifficulty("all"); setStatus("all"); };

  return (
    <div>
      <div className="rounded-lg border border-rule bg-card p-4 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(3,minmax(150px,auto))]">
          <label className="relative block">
            <span className="sr-only">Search challenges</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search briefs, frameworks, artifacts…" className="min-h-11 w-full rounded-md border border-rule bg-paper pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none" />
          </label>
          <CatalogSelect label="Category" value={category} onChange={setCategory} options={categories.map(([value, label]) => ({ value, label }))} />
          <CatalogSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: "warmup", label: "Warmup" }, { value: "intermediate", label: "Intermediate" }, { value: "expert", label: "Expert" }]} />
          <CatalogSelect label="Availability" value={status} onChange={setStatus} options={[{ value: "live", label: "Live" }, { value: "preview", label: "Preview" }]} />
        </div>
        <div className="mt-3 flex min-h-7 items-center justify-between gap-3 border-t border-rule pt-3 font-mono text-xs text-ink-muted" aria-live="polite">
          <span>{visible.length} of {challenges.length} challenges</span>
          {filtered && <button type="button" onClick={reset} className="inline-flex min-h-8 items-center gap-1.5 rounded px-2 text-ink-soft hover:bg-ink/[0.05] hover:text-ink"><X className="size-3.5" /> Clear filters</button>}
        </div>
      </div>

      {visible.length ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {visible.map((challenge) => <ChallengeCard challenge={challenge} key={challenge.slug} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-rule bg-card px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-ink">No matching briefs</h2>
          <p className="mt-2 text-sm text-ink-soft">Try a broader category or clear the current filters.</p>
          <button type="button" onClick={reset} className="mt-5 min-h-10 rounded-md bg-ink px-4 text-sm font-medium text-paper">Reset catalog</button>
        </div>
      )}
    </div>
  );
}

function CatalogSelect({ label, value, onChange, options }: { label: string; value: Filter; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="grid gap-1">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-rule bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none" aria-label={label}>
        <option value="all">All {label.toLocaleLowerCase()}</option>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link href={`/challenges/${challenge.slug}`} className="group block">
      <article className="h-full rounded-lg border border-rule bg-card p-6 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)] transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-rule-strong">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider", challenge.status === "live" ? "bg-ink text-paper" : "border border-rule bg-paper text-ink-soft")}>{challenge.status}</span>
          <span className="rounded border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft">{challenge.difficulty}</span>
          <span className="rounded border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft">{challenge.categoryLabel}</span>
          <span className="inline-flex items-center gap-1 rounded border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft"><Clock className="size-3" /> {challenge.estimatedMinutes} min</span>
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-ink">{challenge.title}</h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{challenge.subtitle}</p>
        <p className="mt-4 font-mono text-xs text-ink-muted">{challenge.framework} · {challenge.artifact} artifact</p>
        <div className="mt-6 rounded-md border border-rule bg-paper p-5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted"><LockKeyhole className="size-3.5 text-accent" /> Evaluator thesis</div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">{challenge.thesis}</p>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-rule pt-5 text-sm">
          <span className="font-mono text-xs text-ink-muted">{challenge.status === "live" ? "Runnable now" : "Brief preview"}</span>
          <span className="inline-flex items-center gap-2 font-medium text-ink group-hover:text-accent">Open <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" /></span>
        </div>
      </article>
    </Link>
  );
}
