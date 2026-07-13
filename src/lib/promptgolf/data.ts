import { scoreRun, type ScoreBreakdown, type TestResult } from "./scoring";
import { collectRunProviderState, getDaytonaAdapterStatus, getOpenAIAdapterStatus, type ProviderProbe } from "./adapters";

export type Challenge = {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: "warmup" | "intermediate" | "expert";
  status: "live" | "preview";
  category: "full-stack" | "backend-api" | "data-ml" | "systems-cli" | "security-reliability" | "domain-workflows";
  categoryLabel: string;
  artifact: "web" | "api" | "cli" | "pipeline" | "library" | "database";
  framework: string;
  estimatedMinutes: number;
  acceptance?: number;
  publicBrief: string;
  thesis: string;
  workedContract?: {
    given: string;
    when: string;
    then: string;
  };
  publicRequirements: string[];
  hiddenTeasers: string[];
  guide: string[];
  evaluation: {
    behavior: string[];
    specCompleteness: "requirement tree";
    artifactAdapter: string;
  };
};

export type RunStage = {
  label: string;
  status: "complete" | "running" | "queued";
  detail: string;
};

export type Run = {
  id: string;
  challengeSlug: string;
  player: string;
  label: "Naive" | "Structured" | "Expert";
  promptCount: number;
  promptExcerpt: string;
  provider: string;
  model: string;
  gateway: string;
  sandbox: string;
  screenshotTitle: string;
  screenshotCaption: string;
  uxScore: number;
  tests: TestResult[];
  stages: RunStage[];
  failureCategories: string[];
  score: ScoreBreakdown;
};

export type PromptClassification = "naive" | "structured" | "expert";

export type PromptSubmissionResult = {
  runId: string;
  run: Run;
  classification: PromptClassification;
  mode: "seeded-local-run";
  challengeSlug: string;
  promptLength: number;
  providerState: ProviderProbe[];
  providerPolicy: {
    provider: "OpenAI AI SDK v6";
    model: "gpt-5.4-mini";
    note: string;
  };
};

const publicTests = [
  ["cart-lines", "Displays cart items, prices, and quantities", "Cart table is visible and scannable."],
  ["quantity-controls", "Allows quantity changes", "Increment and decrement controls are present."],
  ["totals", "Shows subtotal, shipping, tax, discount, and total", "Order summary includes expected rows."],
  ["promo", "Accepts promo codes", "Promo input and apply action are present."],
  ["confirm", "Shows order confirmation", "Checkout reaches a success state."],
] as const;

const hiddenTests = [
  ["cents", "Integer cents math", "Avoids floating-point totals and tax drift."],
  ["promo-normalize", "Promo normalization", "Trims codes and handles case-insensitive matches."],
  ["invalid-code", "Invalid code error", "Bad codes produce clear, recoverable feedback."],
  ["discount-floor", "Discount floor", "Discounts cannot push payable total below zero."],
  ["shipping-threshold", "Shipping threshold order", "Free shipping uses the specified subtotal-before-discount rule."],
  ["out-of-stock", "Out-of-stock block", "Unavailable line items prevent checkout."],
  ["double-submit", "Double-submit prevention", "Repeated clicks cannot create duplicate orders."],
  ["quantity-boundaries", "Quantity boundaries", "Quantities cannot go negative, zero accidentally, or above stock."],
  ["loading-error", "Loading and error states", "Async states are visible and buttons disable while pending."],
  ["mobile-a11y", "Mobile usability and accessibility", "Core controls work on small screens with labels and keyboard affordances."],
] as const;

function makeTests(hiddenPassed: string[]): TestResult[] {
  return [
    ...publicTests.map(([id, label, note]) => ({ id, label, category: "public" as const, passed: true, note })),
    ...hiddenTests.map(([id, label, note]) => ({ id, label, category: "hidden" as const, passed: hiddenPassed.includes(id), note })),
  ];
}

function makeStages(): RunStage[] {
  const daytona = getDaytonaAdapterStatus();

  return [
    { label: "Resolve model", status: "complete", detail: "OpenAI AI SDK v6 selected: gpt-5.4-mini for live builder, visual judge, and prompt diagnosis." },
    {
      label: "Provision sandbox",
      status: daytona.mode === "live" ? "running" : "queued",
      detail:
        daytona.mode === "live"
          ? "Live sandbox adapter is configured; run creation probes the sandbox API and reports connected or degraded state."
          : "Live sandbox adapter is unavailable because sandbox credentials are not configured.",
    },
    { label: "Generate app", status: "complete", detail: "OpenAI builder used bounded Daytona tools to write, inspect, repair, and finalize the project." },
    { label: "Install + build", status: "complete", detail: "Approved install/build/typecheck/test commands run inside Daytona only." },
    { label: "Playwright evaluation", status: "complete", detail: "Stored EvalSpecs materialized into deterministic Playwright behavior checks." },
    { label: "Scorecard", status: "complete", detail: "Scoring rewards public tests, hidden tests, UX/style, and prompt efficiency." },
  ];
}

export const challenges: Challenge[] = [
  {
    slug: "mini-checkout-promo-engine",
    title: "Full Stack Ecommerce Checkout Web App",
    subtitle: "A production checkout brief where vague specs collapse under real commerce edge cases.",
    difficulty: "intermediate",
    status: "live",
    category: "full-stack",
    categoryLabel: "Full-stack & web",
    artifact: "web",
    framework: "Next.js 16",
    estimatedMinutes: 12,
    publicBrief: "Build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.",
    thesis: "The visible checkout is the easy part. Hidden tests reveal whether your spec encodes cents math, stock rules, async safety, and mobile checkout behavior.",
    workedContract: {
      given: "a shopper has cart items",
      when: "quantities or a promo change",
      then: "totals update and checkout reaches a clear confirmation state",
    },
    publicRequirements: [
      "Render Canvas tote ($25.00, quantity 2, stock 3), Espresso beans ($18.00, quantity 1, stock 4), and Stoneware mug ($12.00, quantity 0, stock 0).",
      "Allow labeled quantity changes only from 0 through stock; visibly mark out-of-stock items and disable adding them.",
      "Calculate all money in integer cents: subtotal from line items, 8% tax rounded to cents, $7.00 shipping below a $50.00 pre-discount subtotal, discount, and a nonnegative total.",
      "Normalize promo input by trimming and uppercasing: SAVE10 takes 10% off, FREESHIP removes shipping, BIGSAVE takes $200 off capped at the subtotal, and unknown codes show a recoverable error.",
      "Provide labeled cart, order-summary, promo, and checkout controls that remain usable at mobile widths and by keyboard.",
      "Prevent duplicate checkout submission, show loading and failure states, and finish with exactly one clear order confirmation.",
    ],
    hiddenTeasers: hiddenTests.map(([, label, note]) => `${label}: ${note}`),
    guide: [
      "Restate the visible product goal in one sentence.",
      "List exact state, data, and money-calculation rules before describing UI.",
      "Name edge cases explicitly: stock, invalid promos, quantity limits, double-submit, loading, and mobile.",
      "End with acceptance criteria that map to deterministic tests instead of subjective vibes.",
    ],
    evaluation: {
      behavior: ["deterministic", "state-machine"],
      specCompleteness: "requirement tree",
      artifactAdapter: "web-app-adapter",
    }
  },
  {
    slug: "team-invites-role-management",
    title: "Team Invites + Role Management",
    subtitle: "SaaS settings workflow with hidden lifecycle and permission traps.",
    difficulty: "expert",
    status: "preview",
    category: "domain-workflows",
    categoryLabel: "Domain workflows",
    artifact: "web",
    framework: "Next.js 16",
    estimatedMinutes: 18,
    publicBrief: "Build a team settings page where an owner can invite users, view pending invites, accept invites, and manage roles.",
    thesis: "CRUD is not enough: hidden tests check duplicate invites, single-use tokens, last-owner protection, and role authorization.",
    publicRequirements: [
      "Normalize invite email addresses and allow only one active pending invite per team and email.",
      "List members and pending invites with their current role and lifecycle status.",
      "Accept only a valid, unexpired invite token once; cancelled, replaced, or already-used tokens must fail safely.",
      "Authorize role changes and prevent removing or demoting the team's last owner.",
      "Cancel or resend an invite, invalidating any token that it replaces, and confirm destructive actions.",
    ],
    hiddenTeasers: ["Normalization and duplicate prevention", "Invite-token lifecycle", "Last-owner invariant", "Authorization boundaries", "Destructive-action recovery"],
    guide: ["Specify the permission matrix.", "Define every invite lifecycle transition.", "State token invalidation and last-owner invariants.", "Prove failure and confirmation states."],
    evaluation: {
      behavior: ["deterministic"],
      specCompleteness: "requirement tree",
      artifactAdapter: "web-app-adapter",
    }
  },
  {
    slug: "idempotent-payment-webhooks",
    title: "Idempotent Payment Webhooks",
    subtitle: "Retries, ordering, and atomicity are the product.",
    difficulty: "expert",
    status: "preview",
    category: "backend-api",
    categoryLabel: "Backend & API",
    artifact: "api",
    framework: "Node.js API",
    estimatedMinutes: 22,
    publicBrief: "Build an API that receives signed payment events and updates order state safely across retries.",
    thesis: "Positive evidence covers signature validation, idempotent retries, ordering, and observable recovery.",
    publicRequirements: [
      "Verify each provider signature against the raw request body before parsing or mutating state.",
      "Deduplicate by provider event ID so retries return a stable success response without repeating side effects.",
      "Apply an explicit order-state transition table; late or out-of-order events must not regress a terminal state.",
      "Persist the event record and order transition atomically under concurrent delivery.",
      "Return observable, retry-safe responses for accepted, duplicate, invalid-signature, and temporarily failed events.",
    ],
    hiddenTeasers: ["Signature boundary", "Retry idempotency", "Out-of-order delivery", "Atomic concurrency", "Observable recovery"],
    guide: ["Define the state transition table.", "Specify deduplication and retry responses.", "Cover concurrent and out-of-order delivery.", "Separate permanent rejection from retryable failure."],
    evaluation: {
      behavior: ["state-machine", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "api-adapter",
    }
  },
  {
    slug: "messy-csv-reconciliation",
    title: "Messy CSV Reconciliation",
    subtitle: "Turn inconsistent exports into an explainable ledger.",
    difficulty: "intermediate",
    status: "preview",
    category: "data-ml",
    categoryLabel: "Data & ML",
    artifact: "pipeline",
    framework: "Python pipeline",
    estimatedMinutes: 20,
    publicBrief: "Build a pipeline that reconciles transaction CSVs and emits matched, unmatched, and summary outputs.",
    thesis: "Properties check normalization, decimal-safe totals, duplicates, and provenance.",
    publicRequirements: [
      "Ingest multiple transaction CSV files while handling UTF-8 BOMs, column-name variance, and malformed rows explicitly.",
      "Normalize identifiers, dates, and currency amounts into documented canonical fields using decimal-safe arithmetic.",
      "Match each source record at most once and classify duplicate, matched, and unmatched records deterministically.",
      "Export matched and unmatched rows plus a summary whose counts and totals reconcile to the inputs.",
      "Preserve source file and row provenance for every emitted record and validation error.",
    ],
    hiddenTeasers: ["Encoding and header variance", "Decimal-safe totals", "Duplicate classification", "One-to-one matching", "Provenance and reconciliation"],
    guide: ["Define canonical fields and malformed-row policy.", "Specify one-to-one matching and duplicate semantics.", "Preserve provenance.", "Add count and amount invariants."],
    evaluation: {
      behavior: ["property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "pipeline-adapter",
    }
  },
  {
    slug: "resumable-file-sync-cli",
    title: "Resumable File Sync CLI",
    subtitle: "A CLI tested through interruptions and repeat runs.",
    difficulty: "expert",
    status: "preview",
    category: "systems-cli",
    categoryLabel: "Systems & CLI",
    artifact: "cli",
    framework: "Node.js CLI",
    estimatedMinutes: 24,
    publicBrief: "Build a CLI that synchronizes a directory with dry-run output and resumable transfers.",
    thesis: "State traces prove safe resume, deterministic dry runs, useful exit codes, and scriptable progress.",
    publicRequirements: [
      "Synchronize a source directory recursively into a destination, treating the source as authoritative and preserving relative paths.",
      "Provide a deterministic dry run that reports planned changes without writing files or checkpoints.",
      "Resume interrupted transfers from durable progress without publishing partial files as complete.",
      "Verify completed content before atomic replacement and make repeated runs converge with no unnecessary writes.",
      "Emit scriptable progress and distinct exit codes for success, invalid usage, partial failure, and integrity failure.",
    ],
    hiddenTeasers: ["Interrupted transfer recovery", "Atomic publication", "Repeat-run convergence", "Integrity checking", "Scriptable exits"],
    guide: ["Define source-authoritative conflict semantics.", "Model interruption and checkpoint lifecycle.", "Specify atomic publication and integrity checks.", "Define stable output and exit codes."],
    evaluation: {
      behavior: ["state-machine"],
      specCompleteness: "requirement tree",
      artifactAdapter: "cli-adapter",
    }
  },
  {
    slug: "rate-limit-abuse-controls",
    title: "Rate Limit + Abuse Controls",
    subtitle: "Reliability controls correct at boundaries and under concurrency.",
    difficulty: "expert",
    status: "preview",
    category: "security-reliability",
    categoryLabel: "Security & reliability",
    artifact: "api",
    framework: "HTTP service",
    estimatedMinutes: 20,
    publicBrief: "Build rate-limit middleware with tenant policies, response metadata, and an audit trail.",
    thesis: "Evidence checks policy boundaries, concurrency, recovery, and client feedback—not a preferred algorithm.",
    publicRequirements: [
      "Enforce an explicit limit and window policy independently for each tenant and policy key.",
      "Make allowance decisions atomic under concurrent requests and define the exact window-boundary rule.",
      "Return limit, remaining, reset, and retry-after metadata with stable units and rejected responses.",
      "Record an audit decision without storing raw secrets or allowing audit failure to bypass enforcement.",
      "Recover capacity at the documented reset boundary without leaking usage between tenants.",
    ],
    hiddenTeasers: ["Exact window boundaries", "Concurrent allowance", "Tenant isolation", "Client feedback", "Audit-path failure"],
    guide: ["Define policy and boundary semantics.", "Specify the response contract and units.", "Make concurrent decisions atomic.", "Keep enforcement isolated from audit failures."],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "api-adapter",
    }
  },
  {
    slug: "rate-limiter",
    title: "Rate Limiter",
    subtitle: "A limit per client and one method. Identity and exact window boundaries are the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "security-reliability",
    categoryLabel: "Security & reliability",
    artifact: "library",
    framework: "TypeScript",
    estimatedMinutes: 10,
    publicBrief: "Implement a RateLimiter(limit, windowMs) with allow(key, nowMs). Each canonical client key gets its own sliding window.",
    thesis: "Evidence checks canonical identity, exact window boundaries, rejected-attempt semantics, and isolation across clients.",
    publicRequirements: [
      "constructor(limit, windowMs) and allow(key, nowMs) returning true (permitted) or false (rejected).",
      "Canonicalize each key by trimming surrounding whitespace and lowercasing it before applying a budget.",
      "Rate-limit each canonical key independently over the half-open trailing interval (nowMs - windowMs, nowMs].",
      "Allow a request when fewer than limit accepted timestamps remain in that interval; rejected attempts do not consume capacity.",
      "Require positive integer limit and windowMs values and nondecreasing finite nowMs inputs.",
    ],
    hiddenTeasers: [
      "Canonical identity across case and surrounding-whitespace variants.",
      "Boundary and differential streams across independently budgeted clients.",
    ],
    guide: [
      "Restate the identity and interval rules before choosing a data structure.",
      "Specify validation, rejected-attempt behavior, and independent client state.",
    ],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "library-adapter",
    }
  },
  {
    slug: "idempotent-charge",
    title: "Charge Processor",
    subtitle: "A processor, one method, a request key. What happens when the same request arrives twice is the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "backend-api",
    categoryLabel: "Backend & API",
    artifact: "library",
    framework: "TypeScript",
    estimatedMinutes: 10,
    publicBrief: "Implement a PaymentProcessor with charge(ref, amountCents): it processes an idempotent charge and returns { chargeId, amountCents }.",
    thesis: "Evidence checks stable retries, conflicting reference reuse, and one-charge state under repeated calls.",
    publicRequirements: [
      "charge(ref, amountCents) returning { chargeId, amountCents }.",
      "A first-seen non-empty ref with a positive integer amountCents creates exactly one charge and stores its result.",
      "Repeating the same ref and amount returns the original chargeId and amountCents without creating another charge.",
      "Repeating a ref with a different amount rejects the request and leaves the original charge unchanged.",
    ],
    hiddenTeasers: [
      "Same-request retries return one stable charge.",
      "Conflicting reuse of an idempotency reference fails without mutation.",
    ],
    guide: [
      "Restate the goal in one line: process a charge per call, plus a rule for what a repeat of the same ref means.",
      "Spend your spec on the repeat: name exactly what happens when a ref arrives a second time.",
    ],
    evaluation: {
      behavior: ["deterministic", "state-machine"],
      specCompleteness: "requirement tree",
      artifactAdapter: "library-adapter",
    }
  },
  {
    slug: "buried-answers",
    title: "Buried Answers",
    subtitle: "A search function, a pile of docs, a question. Whether it surfaces the real answer is the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "data-ml",
    categoryLabel: "Data & ML",
    artifact: "library",
    framework: "Python",
    estimatedMinutes: 11,
    publicBrief: "Implement retrieve(documents, query, k): return at most k source passages, best match first.",
    thesis: "Evidence checks source-grounded ranking across direct matches, paraphrases, distractors, and deterministic ties.",
    publicRequirements: [
      "retrieve(documents, query, k) receives an array of passage strings and returns at most k of those original strings, best match first.",
      "Rank direct keyword matches and semantic paraphrases by their likelihood of containing the answer rather than inventing an answer.",
      "Return no duplicates, handle k <= 0 and empty inputs with an empty list, and use deterministic input order for tied scores.",
    ],
    hiddenTeasers: [
      "Paraphrased questions still retrieve the source passage containing the answer.",
      "Distractors, duplicate passages, empty inputs, and stable tie ordering.",
    ],
    guide: [
      "Restate the goal in one line: return the k passages most likely to hold the answer, best first.",
      "Name what to do when the question's words and the answer's words differ.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "library-adapter",
    }
  },
  {
    slug: "interest-accrual",
    title: "Interest Accrual",
    subtitle: "Principal, a rate, two dates, one number. How you count the days between them is the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "domain-workflows",
    categoryLabel: "Domain workflows",
    artifact: "library",
    framework: "TypeScript",
    estimatedMinutes: 10,
    publicBrief: "Implement accruedInterest(principal, annualRate, startISO, endISO) using Actual/365 Fixed.",
    thesis: "Evidence checks UTC calendar-day arithmetic across month ends, leap days, equal dates, and invalid ranges.",
    publicRequirements: [
      "accruedInterest(principal, annualRate, startISO, endISO) returns a number; equal dates return 0.",
      "Interpret valid YYYY-MM-DD inputs as UTC calendar dates and reject an end date before the start date.",
      "Use Actual/365 Fixed: interest = principal × annualRate × elapsed calendar days / 365.",
      "Do not round intermediate results; return the computed number using normal floating-point precision.",
    ],
    hiddenTeasers: [
      "Month-end, leap-day, and year-boundary ranges under Actual/365 Fixed.",
    ],
    guide: [
      "Restate the goal in one line: principal times rate times a year fraction.",
      "Spend your spec on the day count: name exactly which convention governs and how it counts days.",
    ],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "library-adapter",
    }
  },
  {
    slug: "build-a-pool-allocator",
    title: "Fixed-Block Pool Allocator",
    subtitle: "Three functions in C. The memory you forget to give back is the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "systems-cli",
    categoryLabel: "Systems & CLI",
    artifact: "library",
    framework: "C compiler",
    estimatedMinutes: 12,
    publicBrief: "Implement a fixed-block memory pool in C: pool_init(buf, buf_size, block_size), pool_alloc(), and pool_free(ptr).",
    thesis: "Evidence checks capacity, alignment, exhaustion, reuse, and repeated allocation cycles without heap allocation.",
    publicRequirements: [
      "pool_init carves a caller-owned, 8-byte-aligned buffer into floor(buf_size / block_size) fixed-size blocks; block_size is a nonzero multiple of 8.",
      "pool_alloc returns one distinct 8-byte-aligned block from the buffer and never allocates from the heap.",
      "pool_alloc returns NULL after all blocks are allocated.",
      "pool_free returns a previously allocated block so a later allocation can reuse it.",
    ],
    hiddenTeasers: [
      "Exact capacity and aligned in-buffer addresses.",
      "Exhaustion, reuse after free, and repeated allocation cycles.",
    ],
    guide: [
      "Restate the goal in one line, then specify the full lifecycle of a block before any layout.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "library-adapter",
    }
  },
  {
    slug: "events-schema",
    title: "The Guest List",
    subtitle: "Three tables and a count. The constraints you forget are the bugs in production.",
    difficulty: "intermediate",
    status: "preview",
    category: "backend-api",
    categoryLabel: "Backend & API",
    artifact: "database",
    framework: "SQLite 3",
    estimatedMinutes: 11,
    publicBrief: "Design the SQLite schema for an events and RSVP system with enforced relational constraints and an attendance view.",
    thesis: "Evidence checks relational uniqueness, cascades, validation constraints, and complete attendance reporting.",
    publicRequirements: [
      "Create events(name, capacity), users(email), and rsvps linking one user to one event; each table has an integer primary key named id.",
      "Require non-empty event names, positive capacities, and case-insensitively unique user emails.",
      "Prevent duplicate RSVPs for the same user and event with a database constraint.",
      "Deleting an event or user cascades to its RSVPs with foreign-key enforcement enabled.",
      "Create event_attendance with one row for every event, including zero-attendance events, and an attendee_count column.",
    ],
    hiddenTeasers: [
      "Relational uniqueness and foreign-key integrity.",
      "Cascading cleanup and zero-attendance view rows.",
    ],
    guide: [
      "Restate the system in one line, then specify each table's columns and the rules that bind them before any SQL.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "database-adapter",
    }
  }
];

export const challengeCategories = Array.from(new Map(challenges.map(({ category, categoryLabel }) => [category, categoryLabel])).entries()).map(([id, label]) => ({ id, label }));

const seededRunsBase = [
  {
    id: "naive-checkout",
    player: "Naive prompt",
    label: "Naive" as const,
    promptCount: 1,
    promptExcerpt: "Build an ecommerce checkout web app with cart items, quantity changes, promo code, totals, and confirmation. Make it look nice.",
    hiddenPassed: ["invalid-code", "loading-error", "mobile-a11y"],
    uxScore: 6,
    failureCategories: ["Money math", "Promo normalization", "Inventory safety", "Double-submit", "Quantity bounds"],
    screenshotTitle: "Happy-path checkout",
    screenshotCaption: "Looks complete in the browser, but hidden ecommerce behavior is mostly unspecified.",
  },
  {
    id: "structured-checkout",
    player: "Structured spec",
    label: "Structured" as const,
    promptCount: 2,
    promptExcerpt: "Use a spec with states, acceptance tests, promo validation, quantity limits, cents-safe totals, and clear mobile/error behavior.",
    hiddenPassed: ["cents", "promo-normalize", "invalid-code", "discount-floor", "quantity-boundaries", "loading-error", "mobile-a11y"],
    uxScore: 8,
    failureCategories: ["Shipping threshold order", "Out-of-stock block", "Double-submit race"],
    screenshotTitle: "Robust checkout shell",
    screenshotCaption: "Structured requirements catch most bugs, but misses a few domain-specific checkout rules.",
  },
  {
    id: "expert-checkout",
    player: "Expert ecommerce spec",
    label: "Expert" as const,
    promptCount: 1,
    promptExcerpt: "Use integer-cents totals; normalize promos; cap discounts; pre-discount free shipping; enforce stock, double-submit, loading/error, ARIA, and mobile behavior.",
    hiddenPassed: hiddenTests.map(([id]) => id),
    uxScore: 9,
    failureCategories: ["None - all requested hidden checkout checks passed"],
    screenshotTitle: "Production-aware checkout",
    screenshotCaption: "The prompt names the domain quirks hidden tests care about, so the generated app survives reality.",
  },
];

export const runs: Run[] = seededRunsBase.map((run) => {
  const tests = makeTests(run.hiddenPassed);
  const openai = getOpenAIAdapterStatus();
  const daytona = getDaytonaAdapterStatus();
  return {
    ...run,
    challengeSlug: "mini-checkout-promo-engine",
    provider: "OpenAI AI SDK v6",
    model: "gpt-5.4-mini",
    gateway: openai.mode === "live" ? `OpenAI live model · ${openai.model}` : "OpenAI unavailable · set OPENAI_API_KEY",
    sandbox: daytona.mode === "live" ? "Live sandbox adapter configured" : "Sandbox unavailable · configure credentials",
    stages: makeStages(),
    tests,
    score: scoreRun(tests, run.uxScore, run.promptCount),
  };
});

export function getChallenge(slug: string) {
  return challenges.find((challenge) => challenge.slug === slug);
}

export function getRun(id: string) {
  return runs.find((run) => run.id === id);
}

export function getRunsForChallenge(slug: string) {
  return runs.filter((run) => run.challengeSlug === slug).sort((a, b) => b.score.finalScore - a.score.finalScore);
}

export function classifyPrompt(prompt: string): PromptClassification {
  const normalized = prompt.toLowerCase();
  const expertSignals = ["integer cents", "case-insensitive", "stock", "double", "shipping threshold", "negative", "loading", "mobile", "aria"];
  const structuredSignals = ["acceptance", "edge", "test", "validation", "state", "error"];
  const expertCount = expertSignals.filter((signal) => normalized.includes(signal)).length;
  const structuredCount = structuredSignals.filter((signal) => normalized.includes(signal)).length;

  if (expertCount >= 5) return "expert";
  if (structuredCount >= 3 || expertCount >= 2) return "structured";
  return "naive";
}

const runIdByClassification: Record<PromptClassification, string> = {
  naive: "naive-checkout",
  structured: "structured-checkout",
  expert: "expert-checkout",
};

export async function resolvePromptSubmission({ prompt, challengeSlug = "mini-checkout-promo-engine" }: { prompt: string; challengeSlug?: string }): Promise<PromptSubmissionResult> {
  const classification = classifyPrompt(prompt);
  const runId = challengeSlug === "mini-checkout-promo-engine" ? runIdByClassification[classification] : "naive-checkout";
  const run = getRun(runId);

  if (!run) {
    throw new Error(`Seeded run '${runId}' was not found`);
  }

  const providerState = await collectRunProviderState(prompt);

  return {
    runId,
    run,
    classification,
    mode: "seeded-local-run",
    challengeSlug,
    promptLength: prompt.trim().length,
    providerState,
    providerPolicy: {
      provider: "OpenAI AI SDK v6",
      model: "gpt-5.4-mini",
      note: "PromptGolf uses @ai-sdk/openai for live builder, visual judging, and post-score diagnosis. Daytona handles isolated execution; stored EvalSpecs drive deterministic Playwright grading with no fallback provider.",
    },
  };
}
