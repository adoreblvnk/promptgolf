"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import type { LiveRun, LiveRunEvent, LiveRunTestResult } from "@/lib/promptgolf/live-run-store";
import { cn } from "@/lib/utils";

type SafeRun = Omit<LiveRun, "prompt" | "artifactHtml">;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const HIGHLIGHT_CSS = `
.pg-scan{outline:2px solid #d40000!important;outline-offset:4px;border-radius:8px;transition:outline-color .16s,background .16s;box-shadow:0 0 0 6px rgba(212,0,0,.12)!important}
.pg-pass{outline:2px solid #238b45!important;outline-offset:4px;border-radius:8px;background:rgba(35,139,69,.10)!important;box-shadow:0 0 0 6px rgba(35,139,69,.10)!important}
.pg-fail{outline:2px dashed #d40000!important;outline-offset:4px;border-radius:8px;background:rgba(212,0,0,.10)!important;box-shadow:0 0 0 6px rgba(212,0,0,.12)!important}`;

const TARGETS: Record<string, string> = {
  "public-cart": "promoCode",
  cents: "total",
  "promo-normalize": "discount",
  "invalid-code": "promoCode",
  "discount-floor": "total",
  "shipping-threshold": "shipping",
  "quantity-boundaries": "qtyCanvas",
  "out-of-stock": "itemMug",
  "double-submit": "checkout",
  "mobile-a11y": "checkout",
};

function statusTone(level: LiveRunEvent["level"]) {
  if (level === "success") return "text-pass";
  if (level === "warning") return "text-warn";
  if (level === "error") return "text-accent-strong";
  return "text-ink-soft";
}

function statusBadge(level: LiveRunEvent["level"]) {
  if (level === "success") return "border-pass/30 bg-pass-soft text-pass";
  if (level === "warning") return "border-warn/35 bg-warn-soft text-warn";
  if (level === "error") return "border-accent/30 bg-accent-soft text-accent-strong";
  return "border-rule bg-paper text-ink-muted";
}

function testIdSelector(testId: string) {
  return `[data-testid="${testId.replace(/"/g, "\\\"")}"]`;
}

function byTestId(doc: Document, testId: string) {
  return doc.querySelector<HTMLElement>(testIdSelector(testId));
}

function byLabel(doc: Document, pattern: RegExp) {
  const candidates = [...doc.querySelectorAll<HTMLElement>("button, input, select, textarea, [aria-label]")];
  return candidates.find((element) => pattern.test(element.getAttribute("aria-label") ?? element.textContent ?? ""));
}

function byField(doc: Document, pattern: RegExp) {
  const controls = [...doc.querySelectorAll<HTMLElement>("input, textarea, select")];
  return controls.find((element) => {
    const id = element.getAttribute("id");
    const label = id ? doc.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent ?? "" : "";
    const haystack = [label, element.getAttribute("aria-label"), element.getAttribute("placeholder"), element.getAttribute("name"), element.getAttribute("id")].filter(Boolean).join(" ");
    return pattern.test(haystack);
  });
}

function byVisibleText(doc: Document, pattern: RegExp) {
  const candidates = [...doc.querySelectorAll<HTMLElement>("button, [role='button'], [role='status'], output, p, div, section, article, li, span, strong")];
  return candidates.find((element) => pattern.test(element.textContent ?? ""));
}

function byCheckoutTarget(doc: Document, target: string) {
  const fromTestId = byTestId(doc, target);
  if (fromTestId) return fromTestId;
  if (target === "promoCode" || target === "promo-input") return byField(doc, /promo|coupon|discount|code/i);
  if (target === "applyPromo" || target === "apply-promo") return byLabel(doc, /apply|redeem|promo|coupon/i);
  if (target === "checkout") return byLabel(doc, /checkout|confirm|place order|submit order|pay|order/i);
  if (target === "confirmation") return byVisibleText(doc, /confirmed|success|thank|order placed|complete/i);
  if (target === "itemMug" || target === "item-mug") return byVisibleText(doc, /stoneware mug/i);
  if (target === "qtyCanvas" || target === "qty-bag") return byVisibleText(doc, /canvas tote/i);
  if (["subtotal", "discount", "shipping", "tax", "total"].includes(target)) return byVisibleText(doc, new RegExp(target, "i"));
  return undefined;
}

function setInput(doc: Document, value: string) {
  const input = byCheckoutTarget(doc, "promoCode") as HTMLInputElement | HTMLTextAreaElement | null;
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickElement(element: Element | null | undefined) {
  if (element instanceof HTMLElement) element.click();
}

async function replayAction(doc: Document, id: string) {
  if (id === "promo-normalize") {
    setInput(doc, "  save10 ");
    clickElement(byCheckoutTarget(doc, "applyPromo"));
    await wait(180);
  }
  if (id === "invalid-code") {
    setInput(doc, "NOPE");
    clickElement(byCheckoutTarget(doc, "applyPromo"));
    await wait(180);
  }
  if (id === "discount-floor") {
    setInput(doc, "BIGSAVE");
    clickElement(byCheckoutTarget(doc, "applyPromo"));
    await wait(180);
  }
  if (id === "shipping-threshold" || id === "cents") {
    setInput(doc, "SAVE10");
    clickElement(byCheckoutTarget(doc, "applyPromo"));
    await wait(180);
  }
  if (id === "quantity-boundaries") {
    clickElement(byLabel(doc, /increase canvas tote/i));
    await wait(180);
  }
  if (id === "double-submit") {
    clickElement(byCheckoutTarget(doc, "checkout"));
    await wait(100);
    clickElement(byCheckoutTarget(doc, "checkout"));
    await wait(180);
  }
}

function injectStyles(doc: Document) {
  if (doc.getElementById("pg-eval-style")) return;
  const style = doc.createElement("style");
  style.id = "pg-eval-style";
  style.textContent = HIGHLIGHT_CSS;
  doc.head.appendChild(style);
}

export function LiveRunView({ id }: { id: string }) {
  const [run, setRun] = useState<SafeRun | null>(null);
  const [events, setEvents] = useState<LiveRunEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [replayedSignature, setReplayedSignature] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const latestTestsRef = useRef<LiveRunTestResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const response = await fetch(`/api/live-runs/${id}`, { cache: "no-store" });
      if (response.ok && !cancelled) setRun(await response.json());
    };
    void refresh();
    const interval = setInterval(refresh, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    const source = new EventSource(`/api/live-runs/${id}/events`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      const payload = JSON.parse(message.data) as { type: string; run?: SafeRun; event?: LiveRunEvent };
      if (payload.type === "snapshot" && payload.run) {
        setRun(payload.run);
        setEvents(payload.run.events ?? []);
      }
      if (payload.type === "event" && payload.event) {
        const nextEvent = payload.event;
        setEvents((current) => (current.some((event) => event.id === nextEvent.id) ? current : [...current, nextEvent]));
      }
    };
    return () => source.close();
  }, [id]);

  const testsSignature = useMemo(() => run?.tests.map((test) => `${test.id}:${test.passed}`).join("|") ?? "", [run?.tests]);

  useEffect(() => {
    latestTestsRef.current = run?.tests ?? [];
  }, [run?.tests]);

  useEffect(() => {
    if (!run?.previewUrl || !testsSignature) return;
    if (testsSignature === replayedSignature) return;
    const checks = latestTestsRef.current;
    if (!checks.length) return;
    let cancelled = false;

    async function replay(checks: LiveRunTestResult[]) {
      await wait(0);
      if (cancelled) return;
      setReplayIndex(-1);
      let doc: Document | null | undefined;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
          doc = iframeRef.current?.contentDocument;
          if (doc?.body && (doc.querySelector(testIdSelector("total")) || doc.body.textContent?.trim())) break;
        } catch {
          doc = null;
        }
        await wait(150);
      }
      if (!doc || cancelled) return;
      injectStyles(doc);

      for (let index = 0; index < checks.length; index += 1) {
        if (cancelled) return;
        const check = checks[index];
        setReplayIndex(index);
        await replayAction(doc, check.id).catch(() => undefined);
        const target = byCheckoutTarget(doc, TARGETS[check.id] ?? "total");
        target?.classList.remove("pg-pass", "pg-fail");
        target?.classList.add("pg-scan");
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
        await wait(620);
        target?.classList.remove("pg-scan");
        target?.classList.add(check.passed ? "pg-pass" : "pg-fail");
        await wait(360);
      }
      if (!cancelled) {
        setReplayIndex(checks.length);
        setReplayedSignature(testsSignature);
      }
    }

    void replay(checks);
    return () => {
      cancelled = true;
    };
  }, [run?.previewUrl, replayedSignature, testsSignature]);

  const visibleEvents = useMemo(() => events.slice(-80), [events]);
  const testEvents = useMemo(() => events.filter((event) => event.stage === "test").slice(-14), [events]);
  const complete = run?.status === "completed" || run?.status === "failed";
  const previewSrc = run?.previewUrl ? `/api/live-runs/${id}/preview` : undefined;
  const scoreText = run?.score ? `${run.score.passed}/${run.score.total} · ${run.score.finalScore}` : "running";

  if (!run) {
    return <div className="rounded-lg border border-rule bg-card p-6 text-ink-soft">Connecting to live run…</div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-rule bg-card shadow-[0_1px_3px_oklch(0.23_0.022_268/0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">{run.status}</span>
            <span className="rounded border border-rule bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft">stage: {run.stage}</span>
            <span className={cn("rounded border px-2.5 py-1 font-mono text-xs", connected ? "border-pass/30 bg-pass-soft text-pass" : "border-warn/35 bg-warn-soft text-warn")}>{connected ? "SSE connected" : "polling fallback"}</span>
          </div>
          <div className="font-mono text-xs text-ink-muted" data-testid="live-score">score {scoreText}</div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_420px]">
          <div className="border-b border-rule p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">Live checkout preview</h1>
                <p className="mt-1 text-sm text-ink-soft">The generated app is the evidence. Playwright replays checks over this frame when scoring finishes.</p>
              </div>
              {run.previewUrl && <a className="hidden min-h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink/90 sm:inline-flex" href={run.previewUrl} target="_blank" rel="noreferrer">Open app</a>}
            </div>
            <div className="overflow-hidden rounded-lg border border-rule bg-paper">
              <div className="flex items-center gap-3 border-b border-rule bg-paper px-4 py-2.5">
                <div className="flex gap-1.5" aria-hidden="true">
                  <i className="size-2.5 rounded-full bg-accent/70" />
                  <i className="size-2.5 rounded-full bg-warn" />
                  <i className="size-2.5 rounded-full bg-pass" />
                </div>
                <div className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted">{run.previewUrl ?? "waiting for generated artifact"}</div>
                <span className="rounded bg-pass-soft px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-pass">{run.previewLabel ?? "pending"}</span>
              </div>
              {previewSrc ? (
                <iframe ref={iframeRef} title="Generated checkout preview" src={previewSrc} sandbox="allow-scripts allow-same-origin" className="h-[640px] w-full bg-white" />
              ) : (
                <div className="flex h-[640px] items-center justify-center border-t border-dashed border-rule bg-paper text-sm text-ink-muted">Preview appears after Agnes AI returns HTML and the sandbox route is selected.</div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4 p-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Live pipeline</div>
              <dl className="mt-3 grid gap-2">
                <Metric label="Provider" value={run.providerMode} />
                <Metric label="Sandbox" value={run.sandboxMode} />
                <Metric label="Result" value={scoreText} />
              </dl>
            </div>

            <div className="min-h-0 flex-1 rounded-lg border border-rule bg-paper p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2.5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Playwright · hidden tests</div>
                {!complete && <LoaderCircle className="size-3.5 animate-spin text-accent" />}
              </div>
              {run.tests.length ? (
                <ol className="mt-3 space-y-2 font-mono text-xs" data-testid="live-test-results">
                  {run.tests.map((test, index) => {
                    const revealed = replayIndex >= run.tests.length || index < replayIndex;
                    const active = index === replayIndex;
                    return (
                      <li key={test.id} className={cn("rounded-md border p-2.5 transition-[opacity,background-color,border-color]", active ? "border-accent bg-accent-soft opacity-100" : revealed ? "border-rule bg-card opacity-100" : "border-rule bg-card opacity-55")}>
                        <div className="flex items-start gap-2">
                          {revealed ? (
                            test.passed ? <Check className="mt-0.5 size-3.5 shrink-0 text-pass" /> : <X className="mt-0.5 size-3.5 shrink-0 text-accent-strong" />
                          ) : active ? (
                            <LoaderCircle className="mt-0.5 size-3.5 shrink-0 animate-spin text-accent" />
                          ) : (
                            <span className="mt-0.5 text-ink-muted/45">·</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={revealed || active ? "text-ink" : "text-ink-muted"}>{test.label}</span>
                            {revealed && !test.passed && <span className="mt-1 block leading-5 text-accent-strong">{test.note}</span>}
                          </span>
                          {revealed && <span className={cn("shrink-0 text-[10px] font-medium uppercase tracking-wider", test.passed ? "text-pass" : "text-accent-strong")}>{test.passed ? "pass" : "fail"}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="mt-3 space-y-2" data-testid="live-test-results">
                  {testEvents.length ? testEvents.map((event) => (
                    <div key={event.id} className={cn("rounded-md border p-2.5 font-mono text-xs", statusBadge(event.level))}>
                      <div className="text-ink-muted">#{event.id} · {event.stage}</div>
                      <p className={cn("mt-1 leading-5", statusTone(event.level))}>{event.message}</p>
                    </div>
                  )) : <p className="font-mono text-xs leading-5 text-ink-muted">Waiting for Playwright. Test events stream here before the final replay.</p>}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-lg border border-rule bg-card p-5 shadow-[0_1px_2px_oklch(0.23_0.022_268/0.05)]">
        <div className="flex items-center justify-between gap-3 border-b border-rule pb-3">
          <h2 className="text-lg font-semibold text-ink">Streaming execution log</h2>
          <span className="font-mono text-xs text-ink-muted">{visibleEvents.length} events</span>
        </div>
        <ol className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1 font-mono text-xs" data-testid="live-log">
          {visibleEvents.map((event) => (
            <li key={event.id} className={cn("rounded-md border p-3", statusBadge(event.level))}>
              <div className="flex flex-wrap gap-2 text-ink-muted"><span>#{event.id}</span><span>{event.stage}</span><time>{new Date(event.at).toLocaleTimeString()}</time></div>
              <p className={`mt-1 leading-5 ${statusTone(event.level)}`}>{event.message}</p>
            </li>
          ))}
        </ol>
      </section>
      {complete ? <p className="sr-only" data-testid="live-run-complete">Live run complete</p> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-rule bg-card p-3">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words font-mono text-xs font-medium text-ink">{value}</dd>
    </div>
  );
}
