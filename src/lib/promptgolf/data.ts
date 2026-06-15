import { scoreRun, type ScoreBreakdown, type TestResult } from "./scoring";
import { collectRunProviderState, getDaytonaAdapterStatus, getTokenRouterAdapterStatus, type ProviderProbe } from "./adapters";

export type Challenge = {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: "warmup" | "intermediate" | "expert";
  status: "live" | "preview";
  estimatedMinutes: number;
  publicBrief: string;
  thesis: string;
  publicRequirements: string[];
  hiddenTeasers: string[];
  guide: string[];
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
    provider: "Codex CLI";
    model: "gpt-5.5";
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
    { label: "Resolve model", status: "complete", detail: "Codex CLI provider selected: gpt-5.5 through AI SDK adapter." },
    {
      label: "Provision sandbox",
      status: daytona.mode === "live" ? "running" : "queued",
      detail:
        daytona.mode === "live"
          ? "Live sandbox adapter is configured; run creation probes the sandbox API and reports connected or degraded state."
          : "Live sandbox adapter is unavailable because sandbox credentials are not configured.",
    },
    { label: "Generate app", status: "complete", detail: "Agent applied the submitted spec to a Next.js checkout implementation." },
    { label: "Install + build", status: "complete", detail: "npm install cache restored, TypeScript build completed." },
    { label: "Playwright evaluation", status: "complete", detail: "Public and hidden checkout tests executed with product seed cart data." },
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
  },
  {
    slug: "team-invites-role-management",
    title: "Team Invites + Role Management",
    subtitle: "SaaS settings workflow with hidden lifecycle and permission traps.",
    difficulty: "expert",
    status: "preview",
    estimatedMinutes: 18,
    publicBrief: "Build a team settings page where an owner can invite users, view pending invites, accept invites, and manage roles.",
    thesis: "CRUD is not enough: hidden tests check duplicate invites, single-use tokens, last-owner protection, and role authorization.",
    publicRequirements: ["Invite by email", "List members and pending invites", "Change roles", "Cancel or resend invites"],
    hiddenTeasers: ["Email normalization", "Duplicate invite prevention", "Single-use tokens", "Last owner protection", "Danger confirmations"],
    guide: ["Specify permission matrix", "Define invite lifecycle", "Add irreversible-action confirmations", "Prove failure states."],
  },
];

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
    failureCategories: ["None — all requested hidden checkout checks passed"],
    screenshotTitle: "Production-aware checkout",
    screenshotCaption: "The prompt names the domain quirks hidden tests care about, so the generated app survives reality.",
  },
];

export const runs: Run[] = seededRunsBase.map((run) => {
  const tests = makeTests(run.hiddenPassed);
  const tokenRouter = getTokenRouterAdapterStatus();
  const daytona = getDaytonaAdapterStatus();
  return {
    ...run,
    challengeSlug: "mini-checkout-promo-engine",
    provider: "Codex CLI",
    model: "gpt-5.5",
    gateway: tokenRouter.mode === "live" ? `TokenRouter live gateway · ${tokenRouter.model}` : "TokenRouter unavailable · set TOKENROUTER_API_KEY",
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
      provider: "Codex CLI",
      model: "gpt-5.5",
      note: "PromptGolf keeps Codex as the CLI builder-agent boundary. Provider-backed feedback, routing, and sandbox status are reported separately through live adapters when credentials are configured.",
    },
  };
}
