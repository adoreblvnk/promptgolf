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
  artifact: "web" | "api" | "cli" | "pipeline";
  framework: string;
  estimatedMinutes: number;
  publicBrief: string;
  thesis: string;
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
    publicRequirements: [
      "Display cart items with name, price, and quantity.",
      "Allow quantity changes.",
      "Show subtotal, shipping, tax, discount, and total.",
      "Accept promo codes.",
      "Provide a checkout/confirm order button and success state.",
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
    publicRequirements: ["Invite by email", "List members and pending invites", "Change roles", "Cancel or resend invites"],
    hiddenTeasers: ["Email normalization", "Duplicate invite prevention", "Single-use tokens", "Last owner protection", "Danger confirmations"],
    guide: ["Specify permission matrix", "Define invite lifecycle", "Add irreversible-action confirmations", "Prove failure states."],
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
    publicRequirements: ["Receive signed events", "Update order state", "Return stable responses"],
    hiddenTeasers: ["Retry idempotency", "Event ordering", "Atomic updates"],
    guide: ["Define the state machine", "Specify retries", "Cover concurrency"],
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
    publicRequirements: ["Ingest CSVs", "Normalize records", "Export audit results"],
    hiddenTeasers: ["Encoding variance", "Decimal precision", "Duplicate records"],
    guide: ["Define canonical fields", "Preserve provenance", "Add invariants"],
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
    publicRequirements: ["Sync a directory", "Support dry run", "Resume work"],
    hiddenTeasers: ["Interrupted resume", "Convergence", "Exit codes"],
    guide: ["Specify exits", "Model interruptions", "Define convergence"],
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
    publicRequirements: ["Enforce tenant limits", "Return metadata", "Record decisions"],
    hiddenTeasers: ["Window boundaries", "Concurrency", "Tenant isolation"],
    guide: ["Define policy semantics", "Specify contracts", "Make decisions observable"],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "api-adapter",
    }
  },
  {
    slug: "rate-limiter",
    title: "Rate Limiter",
    subtitle: "A limit per client and one method. Who counts as the same client is the whole game.",
    difficulty: "expert",
    status: "preview",
    category: "security-reliability",
    categoryLabel: "Security & reliability",
    artifact: "api",
    framework: "HTTP service",
    estimatedMinutes: 10,
    publicBrief: "Implement a RateLimiter(limit, windowMs) with allow(key, nowMs). Each client key gets its own sliding window.",
    thesis: "The sliding window is the easy part the model builds for free. The hidden test is who counts as the same client.",
    publicRequirements: [
      "constructor(limit, windowMs) and allow(key, nowMs) returning true (permitted) or false (rejected).",
      "Each client key is rate-limited independently on its own sliding window over the trailing windowMs.",
      "Once a key's earlier requests fall outside the window, that key is allowed through again.",
    ],
    hiddenTeasers: [
      "Same client, different spelling: two keys that refer to the same client must share one budget.",
      "Differential fuzz: hundreds of random multi-client streams, with each client arriving under several spellings.",
    ],
    guide: [
      "Restate the goal in one line: a sliding window per client, plus a rule for who counts as the same client.",
      "The sliding window is the floor. Spend your spec on the key: name exactly how two keys are judged to be the same client.",
    ],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "api-adapter",
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
    artifact: "api",
    framework: "Node.js API",
    estimatedMinutes: 10,
    publicBrief: "Implement a PaymentProcessor with charge(ref, amountCents): it processes a charge and returns { chargeId, amountCents }.",
    thesis: "Recording a charge and minting an id is the easy part. The hidden test is what happens when a client retries.",
    publicRequirements: [
      "charge(ref, amountCents) returning { chargeId, amountCents }.",
      "A first-seen ref is charged for the amountCents it was given.",
      "ref is a string the caller passes in with the charge; amountCents is an integer number of cents.",
    ],
    hiddenTeasers: [
      "Retried request, one charge: a request that arrives again under a ref already handled must not become a second charge.",
    ],
    guide: [
      "Restate the goal in one line: process a charge per call, plus a rule for what a repeat of the same ref means.",
      "Spend your spec on the repeat: name exactly what happens when a ref arrives a second time.",
    ],
    evaluation: {
      behavior: ["deterministic", "state-machine"],
      specCompleteness: "requirement tree",
      artifactAdapter: "api-adapter",
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
    artifact: "pipeline",
    framework: "Python pipeline",
    estimatedMinutes: 11,
    publicBrief: "Implement retrieve(documents, query, k): return at most k passages from the documents, best match first.",
    thesis: "Scoring passages by how many query words they contain is the easy part. The hidden test is semantic search where the answer is written in different words.",
    publicRequirements: [
      "retrieve(documents, query, k) returning at most k passage strings, best match first.",
      "A plain keyword question whose answer sits in a short page lands in the top k.",
    ],
    hiddenTeasers: [
      "When the question and the answer are written in different words, the search still has to reach the answer.",
    ],
    guide: [
      "Restate the goal in one line: return the k passages most likely to hold the answer, best first.",
      "Name what to do when the question's words and the answer's words differ.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "pipeline-adapter",
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
    artifact: "pipeline",
    framework: "TypeScript",
    estimatedMinutes: 10,
    publicBrief: "Implement accruedInterest(principal, annualRate, startISO, endISO): the interest that accrues on a principal at an annual rate over the date range.",
    thesis: "Multiplying principal by rate by a time fraction is the easy part. The hidden test is how you turn two calendar dates into a span.",
    publicRequirements: [
      "accruedInterest(principal, annualRate, startISO, endISO) returning a number; equal dates return 0.",
      "Interest is principal times annualRate times the fraction of a year the range covers.",
    ],
    hiddenTeasers: [
      "Month-end day count: the day-count convention is exactly where a vague spec drifts.",
    ],
    guide: [
      "Restate the goal in one line: principal times rate times a year fraction.",
      "Spend your spec on the day count: name exactly which convention governs and how it counts days.",
    ],
    evaluation: {
      behavior: ["property-based", "fuzzing"],
      specCompleteness: "requirement tree",
      artifactAdapter: "pipeline-adapter",
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
    artifact: "cli",
    framework: "C compiler",
    estimatedMinutes: 12,
    publicBrief: "Implement a fixed-block memory pool in C: pool_init(buf, buf_size, block_size), pool_alloc() returns one block, pool_free(ptr) returns it.",
    thesis: "The signature is trivial. The hidden tests are the allocator laws a vague spec forgets.",
    publicRequirements: [
      "pool_init carves the buffer into fixed-size blocks.",
      "pool_alloc returns one 8-byte-aligned block from the buffer.",
      "pool_free returns a block to the pool.",
    ],
    hiddenTeasers: [
      "Exhaustion returns NULL: a full pool must refuse.",
      "Reuse after free: a freed block must be handed back.",
    ],
    guide: [
      "Restate the goal in one line, then specify the full lifecycle of a block before any layout.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "cli-adapter",
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
    artifact: "pipeline",
    framework: "SQLite 3",
    estimatedMinutes: 11,
    publicBrief: "Design the SQLite schema for a small events / RSVP system: events with a capacity, users, and RSVPs.",
    thesis: "Anyone can write three CREATE TABLEs. The hidden tests are the relational rules a vague schema forgets.",
    publicRequirements: [
      "Tables events (name, capacity), users (email), and rsvps linking a user to an event.",
      "Each table has an integer primary key named id.",
      "A view event_attendance reporting a count of attendees per event.",
    ],
    hiddenTeasers: [
      "No double-RSVP: the same user can't RSVP to the same event twice.",
      "Clean delete: removing an event must remove its RSVPs.",
    ],
    guide: [
      "Restate the system in one line, then specify each table's columns and the rules that bind them before any SQL.",
    ],
    evaluation: {
      behavior: ["deterministic", "property-based"],
      specCompleteness: "requirement tree",
      artifactAdapter: "pipeline-adapter",
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
