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

async function text(page: Page, testId: string) {
  return (await page.getByTestId(testId).innerText({ timeout: 2500 })).trim();
}

function locator(page: Page, target: EvaluatorTarget): Locator {
  if (target.by === "testId") return page.getByTestId(target.value);
  if (target.by === "label") return page.getByLabel(pattern(target.pattern));
  if (target.by === "text") return page.getByText(pattern(target.pattern)).first();
  return page.getByTestId(target.testId).getByText(pattern(target.pattern));
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
    await page.getByTestId(action.testId).waitFor();
    return;
  }
  if (action.kind === "fill") {
    await page.getByTestId(action.testId).fill(action.value);
    return;
  }
  if (action.kind === "click") {
    await locator(page, action.target).click();
    return;
  }
  if (action.kind === "clickTwice") {
    const button = page.getByTestId(action.testId);
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
    const target = locator(page, assertion.target);
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
    const target = locator(page, assertion.target);
    if (await target.isEnabled()) throw new Error("Expected target control to be disabled.");
    return;
  }
  const box = await page.getByTestId(assertion.testId).boundingBox();
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
