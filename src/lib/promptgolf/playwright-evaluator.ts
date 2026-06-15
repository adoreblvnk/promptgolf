import { chromium, type Locator, type Page } from "playwright";
import type { LiveRunTestResult } from "./live-run-store";
import type { EvaluatorAction, EvaluatorAssertion, EvaluatorTarget, NaturalLanguageEvaluatorSpec } from "./evaluator-specs";

function pattern(source: string) {
  return new RegExp(source, "i");
}

function moneyToCents(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return Math.round(Number(cleaned) * 100);
}

const checkoutTerms: Record<string, { labels?: string[]; testIds?: string[]; css?: string[]; text?: string }> = {
  promoCode: {
    labels: ["promo", "coupon", "discount code", "code"],
    testIds: ["promo-input", "promo", "coupon-input", "discount-code"],
    css: ["input", "textarea"],
  },
  applyPromo: {
    labels: ["apply", "redeem", "use code", "promo", "coupon"],
    testIds: ["apply-promo", "apply-coupon", "redeem-code"],
    css: ["button"],
  },
  checkout: {
    labels: ["checkout", "confirm", "place order", "submit order", "pay", "order"],
    testIds: ["checkout", "confirm-order", "place-order"],
    css: ["button"],
  },
  confirmation: {
    labels: ["confirmed", "success", "thank", "order placed", "complete"],
    testIds: ["confirmation", "success", "order-confirmation"],
    text: "confirmed|success|thank|order placed|complete",
  },
  qtyCanvas: { labels: ["canvas tote"], testIds: ["qty-bag", "quantity-bag", "qty-canvas", "quantity-canvas"] },
  qtyBeans: { labels: ["espresso beans"], testIds: ["qty-beans", "quantity-beans"] },
  qtyMug: { labels: ["stoneware mug"], testIds: ["qty-mug", "quantity-mug"] },
  itemMug: { labels: ["stoneware mug"], testIds: ["item-mug", "mug", "stoneware-mug"], text: "stoneware mug" },
};

const moneyLabels: Record<string, string[]> = {
  subtotal: ["subtotal", "items total"],
  discount: ["discount", "promo", "coupon", "savings"],
  shipping: ["shipping", "delivery"],
  tax: ["tax", "sales tax", "vat"],
  total: ["total", "grand total", "order total", "amount due"],
};

function escapedAttribute(value: string) {
  return value.replace(/"/g, "\\\"");
}

function semanticCandidates(page: Page, key: string): Locator[] {
  const config = checkoutTerms[key];
  const candidates: Locator[] = [page.getByTestId(key)];

  for (const testId of config?.testIds ?? []) {
    if (testId !== key) candidates.push(page.getByTestId(testId));
  }

  for (const label of config?.labels ?? []) {
    candidates.push(page.getByLabel(pattern(label)).first());
    candidates.push(page.getByRole("button", { name: pattern(label) }).first());
  }

  if (config?.css?.includes("input")) {
    const attrs = (config.labels ?? []).flatMap((label) => [
      `input[aria-label*="${escapedAttribute(label)}" i]`,
      `input[placeholder*="${escapedAttribute(label)}" i]`,
      `input[name*="${escapedAttribute(label)}" i]`,
      `input[id*="${escapedAttribute(label)}" i]`,
      `textarea[aria-label*="${escapedAttribute(label)}" i]`,
      `textarea[placeholder*="${escapedAttribute(label)}" i]`,
    ]);
    if (attrs.length) candidates.push(page.locator(attrs.join(", ")).first());
  }

  if (config?.css?.includes("button")) {
    const attrs = (config.labels ?? []).flatMap((label) => [
      `button[aria-label*="${escapedAttribute(label)}" i]`,
      `button:has-text("${escapedAttribute(label)}")`,
      `[role="button"][aria-label*="${escapedAttribute(label)}" i]`,
      `[role="button"]:has-text("${escapedAttribute(label)}")`,
    ]);
    if (attrs.length) candidates.push(page.locator(attrs.join(", ")).first());
  }

  if (config?.text) candidates.push(page.getByText(pattern(config.text)).first());

  return candidates;
}

async function firstAvailable(candidates: Locator[], timeoutMs = 900) {
  for (const candidate of candidates) {
    const locator = candidate.first();
    if ((await locator.count().catch(() => 0)) === 0) continue;
    await locator.waitFor({ state: "visible", timeout: timeoutMs }).catch(() => undefined);
    if (await locator.isVisible().catch(() => false)) return locator;
  }
  throw new Error("Expected generated app to expose the requested control or content, but no matching visible element was found.");
}

async function locator(page: Page, target: EvaluatorTarget): Promise<Locator> {
  if (target.by === "testId") return firstAvailable(semanticCandidates(page, target.value));
  if (target.by === "label") return firstAvailable([page.getByLabel(pattern(target.pattern)).first(), page.getByRole("button", { name: pattern(target.pattern) }).first()]);
  if (target.by === "text") return firstAvailable([page.getByText(pattern(target.pattern)).first()]);
  const region = await firstAvailable(semanticCandidates(page, target.testId));
  return region.getByText(pattern(target.pattern)).first();
}

async function bodyText(page: Page) {
  return (await page.locator("body").innerText({ timeout: 2500 })).trim();
}

function firstMoneyNearLabel(source: string, labels: string[]) {
  const normalized = source.replace(/\s+/g, " ");
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = normalized.match(new RegExp(`\\b${escaped}\\b[^$0-9-]{0,30}(-?\\$?\\d+(?:\\.\\d{2})?)`, "i"));
    if (after?.[1]) return after[1];
    const before = normalized.match(new RegExp(`(-?\\$?\\d+(?:\\.\\d{2})?)[^A-Za-z0-9$-]{0,30}\\b${escaped}\\b`, "i"));
    if (before?.[1]) return before[1];
  }
  return undefined;
}

function firstNumberNearLabel(source: string, labels: string[]) {
  const normalized = source.replace(/\s+/g, " ");
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = normalized.match(new RegExp(`\\b${escaped}\\b.{0,140}?(?:qty|quantity|in cart|×|x)\\D{0,20}(\\d+)`, "i"));
    if (match?.[1]) return match[1];
  }
  return undefined;
}

async function text(page: Page, key: string) {
  const testIdText = await page.getByTestId(key).innerText({ timeout: 700 }).catch(() => "");
  if (testIdText.trim()) return testIdText.trim();

  const inputValue = await page.getByTestId(key).inputValue({ timeout: 700 }).catch(() => "");
  if (inputValue.trim()) return inputValue.trim();

  const source = await bodyText(page);
  if (moneyLabels[key]) {
    const value = firstMoneyNearLabel(source, moneyLabels[key]);
    if (value) return value;
  }
  if (checkoutTerms[key]?.labels) {
    const value = firstNumberNearLabel(source, checkoutTerms[key].labels);
    if (value) return value;
  }

  const fallback = await (await firstAvailable(semanticCandidates(page, key))).innerText().catch(() => "");
  if (fallback.trim()) return fallback.trim();
  throw new Error(`Could not read '${key}' from generated app by test id, label, text, or page snapshot.`);
}

async function waitForTextMatch(target: Locator, source: string, timeoutMs = 2500) {
  const started = Date.now();
  let lastText = "";
  while (Date.now() - started < timeoutMs) {
    lastText = await target.innerText().catch(() => "");
    if (pattern(source).test(lastText)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Expected target text to match /${source}/i, got '${lastText}'`);
}

async function runAction(page: Page, action: EvaluatorAction) {
  if (action.kind === "waitForText") {
    await page.getByText(pattern(action.pattern)).first().waitFor();
    return;
  }
  if (action.kind === "waitForTestId") {
    await firstAvailable(semanticCandidates(page, action.testId));
    return;
  }
  if (action.kind === "fill") {
    await (await firstAvailable(semanticCandidates(page, action.testId))).fill(action.value);
    return;
  }
  if (action.kind === "click") {
    await (await locator(page, action.target)).click();
    return;
  }
  if (action.kind === "clickTwice") {
    const button = await firstAvailable(semanticCandidates(page, action.testId));
    await Promise.allSettled([button.click(), button.click()]);
    return;
  }
  if (action.kind === "setViewport") {
    await page.setViewportSize({ width: action.width, height: action.height });
    return;
  }
  await page.getByText(pattern(action.pattern)).waitFor({ timeout: action.timeoutMs }).catch(() => undefined);
}

async function runAssertion(page: Page, assertion: EvaluatorAssertion) {
  if (assertion.kind === "moneySumEquals") {
    const addends = await Promise.all(assertion.addends.map(async (testId) => moneyToCents(await text(page, testId))));
    const expected = moneyToCents(await text(page, assertion.expected));
    const actual = addends.reduce((sum, value) => sum + value, 0);
    if (actual !== expected) throw new Error(`Expected ${assertion.addends.join(" + ")} to equal ${assertion.expected}, got ${actual} != ${expected}`);
    return;
  }
  if (assertion.kind === "moneyLessThan") {
    const actual = moneyToCents(await text(page, assertion.testId));
    if (actual >= assertion.cents) throw new Error(`Expected ${assertion.testId} to be less than ${assertion.cents} cents, got ${actual}`);
    return;
  }
  if (assertion.kind === "moneyAtLeast") {
    const actual = moneyToCents(await text(page, assertion.testId));
    if (actual < assertion.cents) throw new Error(`Expected ${assertion.testId} to be at least ${assertion.cents} cents, got ${actual}`);
    return;
  }
  if (assertion.kind === "moneyEquals") {
    const actual = moneyToCents(await text(page, assertion.testId));
    if (actual !== assertion.cents) throw new Error(`Expected ${assertion.testId} to equal ${assertion.cents} cents, got ${actual}`);
    return;
  }
  if (assertion.kind === "textMatches") {
    const target = await locator(page, assertion.target);
    await target.waitFor();
    if (assertion.pattern === ".*") return;
    await waitForTextMatch(target, assertion.pattern);
    return;
  }
  if (assertion.kind === "numberAtMost") {
    const actual = Number(await text(page, assertion.testId));
    if (actual > assertion.max) throw new Error(`Expected ${assertion.testId} to be <= ${assertion.max}, got ${actual}`);
    return;
  }
  if (assertion.kind === "isDisabled") {
    const target = await locator(page, assertion.target);
    if (await target.isEnabled()) throw new Error("Expected target control to be disabled.");
    return;
  }
  const box = await (await firstAvailable(semanticCandidates(page, assertion.testId))).boundingBox();
  if (!box || box.height < assertion.minPx) throw new Error(`Expected ${assertion.testId} touch target height to be at least ${assertion.minPx}px.`);
}

async function evaluateSpec(page: Page, spec: NaturalLanguageEvaluatorSpec): Promise<LiveRunTestResult> {
  try {
    for (const action of spec.actions) await runAction(page, action);
    for (const assertion of spec.assertions) await runAssertion(page, assertion);
    return { id: spec.id, label: spec.label, category: spec.category, passed: true, note: spec.intent };
  } catch (error) {
    return { id: spec.id, label: spec.label, category: spec.category, passed: false, note: error instanceof Error ? error.message : String(error) };
  }
}

export async function evaluateSpecsWithPlaywright(input: {
  url: string;
  specs: NaturalLanguageEvaluatorSpec[];
  onResult?: (result: LiveRunTestResult) => void;
}) {
  const browser = await chromium.launch({ headless: true });
  const results: LiveRunTestResult[] = [];
  try {
    for (const spec of input.specs) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 860 } });
      page.setDefaultTimeout(3500);
      try {
        await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 10000 });
        const result = await evaluateSpec(page, spec);
        results.push(result);
        input.onResult?.(result);
      } finally {
        await page.close();
      }
    }
    return results;
  } finally {
    await browser.close();
  }
}
