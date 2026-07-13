"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, EyeOff, FileText, Gauge, Lightbulb, LockKeyhole } from "lucide-react";
import type { Challenge } from "@/lib/promptgolf/data";
import { cn } from "@/lib/utils";

type LeftTab = "description" | "guide" | "evaluation";
type MobilePane = "problem" | "solve";

export function ChallengeWorkbench({ challenge, number, previousHref, nextHref, editor }: { challenge: Challenge; number: number; previousHref?: string; nextHref?: string; editor: ReactNode }) {
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [mobilePane, setMobilePane] = useState<MobilePane>("problem");
  const acceptance = challenge.acceptance === undefined ? "—" : `${challenge.acceptance.toFixed(1)}%`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-[48px] shrink-0 items-center justify-between gap-2 border-b border-rule bg-card px-2.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/challenges" className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded px-1.5 text-[12px] text-ink-muted hover:bg-white/[0.05] hover:text-ink"><ChevronLeft className="size-3.5" /><span className="hidden sm:inline">Problems</span></Link>
          <span className="h-4 w-px bg-rule" aria-hidden="true" />
          <span className="hidden font-mono text-[11px] tabular-nums text-ink-muted sm:inline">{String(number).padStart(2, "0")}</span>
          <h1 className="truncate text-[13px] font-medium text-ink">{challenge.title}</h1>
          <span className="hidden rounded bg-warn-soft px-1.5 py-0.5 text-[10px] capitalize text-warn md:inline">{challenge.difficulty}</span>
          <span className="hidden text-[11px] text-ink-muted lg:inline">{challenge.categoryLabel}{challenge.acceptance === undefined ? "" : ` · ${acceptance} accepted`}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex rounded border border-rule p-0.5 lg:hidden" aria-label="Workspace pane">
            {(["problem", "solve"] as MobilePane[]).map((pane) => <button key={pane} type="button" aria-pressed={mobilePane === pane} onClick={() => setMobilePane(pane)} className={cn("min-h-7 rounded px-2 text-[11px] capitalize", mobilePane === pane ? "bg-white/[0.08] text-ink" : "text-ink-muted")}>{pane}</button>)}
          </div>
          <Link href={previousHref ?? "#"} aria-disabled={!previousHref} tabIndex={previousHref ? 0 : -1} className={cn("grid size-8 place-items-center rounded text-ink-muted hover:bg-white/[0.05] hover:text-ink", !previousHref && "pointer-events-none opacity-30")} aria-label="Previous challenge"><ChevronLeft className="size-4" /></Link>
          <Link href={nextHref ?? "#"} aria-disabled={!nextHref} tabIndex={nextHref ? 0 : -1} className={cn("grid size-8 place-items-center rounded text-ink-muted hover:bg-white/[0.05] hover:text-ink", !nextHref && "pointer-events-none opacity-30")} aria-label="Next challenge"><ChevronRight className="size-4" /></Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(360px,42%)_minmax(0,58%)]">
        <section className={cn("min-h-0 flex-col border-r border-rule", mobilePane === "problem" ? "flex h-full" : "hidden lg:flex")} aria-label="Problem statement">
          <div className="flex min-h-10 shrink-0 items-end gap-1 border-b border-rule bg-white/[0.015] px-2" role="tablist" aria-label="Problem information">
            <TabButton active={leftTab === "description"} onClick={() => setLeftTab("description")} icon={<FileText className="size-3.5" />}>Description</TabButton>
            <TabButton active={leftTab === "guide"} onClick={() => setLeftTab("guide")} icon={<Lightbulb className="size-3.5" />}>Guide</TabButton>
            <TabButton active={leftTab === "evaluation"} onClick={() => setLeftTab("evaluation")} icon={<Gauge className="size-3.5" />}>Evaluation</TabButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {leftTab === "description" && <Description challenge={challenge} number={number} acceptance={acceptance} />}
            {leftTab === "guide" && <Guide challenge={challenge} />}
            {leftTab === "evaluation" && <Evaluation challenge={challenge} />}
          </div>
        </section>

        <section className={cn("min-h-0 flex-col bg-[#111317]", mobilePane === "solve" ? "flex h-full" : "hidden lg:flex")} aria-label="Spec editor">
          <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-rule bg-card px-2">
            <span className="flex min-h-9 items-center border-b-2 border-accent px-2.5 text-[12px] font-medium text-ink">Spec</span>
            <span className="pr-2 text-[10px] text-ink-muted">Results open after submission</span>
          </div>
          {editor}
        </section>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex min-h-9 items-center gap-1.5 border-b-2 px-2.5 text-[12px] transition-colors", active ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink-soft")}>{icon}{children}</button>;
}

function Description({ challenge, number, acceptance }: { challenge: Challenge; number: number; acceptance: string }) {
  return (
    <div className="mx-auto max-w-[74ch]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-ink-muted">Problem {String(number).padStart(2, "0")}</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-ink">{challenge.title}</h2>
        </div>
        <span className={cn("mt-1 inline-flex items-center gap-1 rounded px-2 py-1 text-[10px]", challenge.status === "live" ? "bg-pass-soft text-pass" : "bg-white/[0.05] text-ink-muted")}>
          {challenge.status === "live" ? <CheckCircle2 className="size-3" /> : <LockKeyhole className="size-3" />}{challenge.status}
        </span>
      </div>
      <p className="mt-5 text-[14px] leading-6 text-ink-soft">{challenge.publicBrief}</p>

      <ProblemHeading>Requirements</ProblemHeading>
      <ol className="mt-3 space-y-2.5">
        {challenge.publicRequirements.map((requirement, index) => <li key={requirement} className="flex gap-3 text-[13px] leading-5.5 text-ink-soft"><span className="font-mono text-[11px] text-ink-muted">{String(index + 1).padStart(2, "0")}</span><span>{requirement}</span></li>)}
      </ol>

      {challenge.workedContract && (
        <>
          <ProblemHeading>Worked contract</ProblemHeading>
          <div className="mt-3 rounded border border-rule bg-black/20 font-mono text-[11px] leading-5 text-ink-soft">
            <div className="border-b border-rule px-3 py-2 text-ink-muted">Example user flow</div>
            <div className="p-3"><span className="text-pass">Given</span> {challenge.workedContract.given}<br /><span className="text-warn">When</span> {challenge.workedContract.when}<br /><span className="text-accent">Then</span> {challenge.workedContract.then}</div>
          </div>
        </>
      )}

      <ProblemHeading>Constraints</ProblemHeading>
      <ul className="mt-3 space-y-2 text-[13px] leading-5 text-ink-soft">
        <li>• Submit one compact engineering spec, not implementation code.</li>
        <li>• The generated artifact must use the declared {challenge.framework} adapter.</li>
        <li>• Scoring rewards observable behavior and prompt efficiency, not runtime.</li>
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-4">
        <Meta icon={<Gauge className="size-3.5" />} label="Difficulty" value={challenge.difficulty} />
        <Meta icon={<Clock3 className="size-3.5" />} label="Target" value={`${challenge.estimatedMinutes} min`} />
        <Meta icon={<ClipboardCheck className="size-3.5" />} label="Acceptance" value={acceptance} />
        <Meta icon={<FileText className="size-3.5" />} label="Artifact" value={challenge.artifact} />
      </div>
    </div>
  );
}

function Guide({ challenge }: { challenge: Challenge }) {
  return (
    <div className="mx-auto max-w-[70ch]">
      <h2 className="text-lg font-semibold text-ink">Write a spec that can be tested</h2>
      <p className="mt-2 text-[13px] leading-6 text-ink-soft">A one-shot prompt is not a paragraph. It is a compact engineering spec with explicit states, rules, boundaries, and acceptance criteria.</p>
      <ol className="mt-5 divide-y divide-rule border-y border-rule">
        {challenge.guide.map((step, index) => <li key={step} className="flex gap-3 py-3 text-[13px] leading-5.5 text-ink-soft"><span className="font-mono text-accent">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
      </ol>
      <div className="mt-6 rounded border border-rule bg-white/[0.025] p-4">
        <h3 className="text-[13px] font-medium text-ink">Recommended structure</h3>
        <p className="mt-2 font-mono text-[11px] leading-6 text-ink-muted">ROLE → GOAL → CONTEXT → DOMAIN RULES → TASK → EDGE CASES → VALIDATION → OUTPUT</p>
      </div>
    </div>
  );
}

function Evaluation({ challenge }: { challenge: Challenge }) {
  return (
    <div className="mx-auto max-w-[70ch]">
      <div className="flex items-center gap-2"><EyeOff className="size-4 text-warn" /><h2 className="text-lg font-semibold text-ink">How this problem is judged</h2></div>
      <p className="mt-3 text-[13px] leading-6 text-ink-soft">{challenge.thesis}</p>
      <div className="mt-5 divide-y divide-rule border-y border-rule">
        <EvalRow title="Public behavior" body="Visible requirements are exercised against the generated artifact." />
        <EvalRow title="Production edge cases" body="Private cases vary realistic inputs and boundaries without changing the published contract." />
        <EvalRow title="Product quality" body="Keyboard access, mobile usability, hierarchy, and clear states contribute observable evidence." />
        <EvalRow title="Golf efficiency" body="Passing more checks with fewer human prompts produces the strongest round." />
      </div>
      <h3 className="mt-6 text-[13px] font-medium text-ink">Evaluation focus</h3>
      <ul className="mt-2 space-y-2" aria-label="Evaluation focus">
        {challenge.hiddenTeasers.map((focus) => <li key={focus} className="flex gap-2 text-[12px] leading-5 text-ink-muted"><span className="text-warn" aria-hidden="true">•</span><span>{focus}</span></li>)}
      </ul>
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Evaluation methods">
        {challenge.evaluation.behavior.map((method) => <span key={method} className="rounded border border-rule bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-ink-muted">{method}</span>)}
      </div>
      <p className="mt-5 rounded border border-rule bg-white/[0.025] p-3 text-[12px] leading-5 text-ink-muted">Private inputs and evaluator source remain hidden. They may vary the published rules above, but do not introduce a different contract.</p>
    </div>
  );
}

function ProblemHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 border-b border-rule pb-2 text-[13px] font-semibold text-ink">{children}</h3>;
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="bg-card p-3"><div className="flex items-center gap-1.5 text-[10px] text-ink-muted">{icon}{label}</div><div className="mt-1 text-[12px] capitalize text-ink-soft">{value}</div></div>;
}

function EvalRow({ title, body }: { title: string; body: string }) {
  return <div className="py-3"><h3 className="text-[13px] font-medium text-ink">{title}</h3><p className="mt-1 text-[12px] leading-5 text-ink-muted">{body}</p></div>;
}
