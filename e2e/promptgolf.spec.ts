import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test("PromptGolf demo flow renders challenge, leaderboard, and expert run", async ({ page }) => {
  await page.goto(baseURL);
  await expect(page).toHaveTitle("PromptGolf - LeetCode for agentic prompting");
  await expect(page.getByText("Live sandbox API credentials are configured")).toBeVisible();
  await page.getByRole("link", { name: /Try the challenge/i }).click();

  await expect(page.getByRole("heading", { name: "Full Stack Ecommerce Checkout Web App" })).toBeVisible();
  await expect(page.getByText("Live execution", { exact: true })).toBeVisible();
  await expect(page.getByText("Integer cents math")).toBeVisible();

  await page.getByLabel("Prompt submission").fill("Build checkout with integer cents, case-insensitive promo normalization, stock limits, double-submit lock, shipping threshold order, negative discount floor, loading states, mobile layout, and aria labels.");
  await page.getByRole("button", { name: /Submit prompt/i }).click();

  await expect(page).toHaveURL(/\/live-runs\/live-/);
  await expect(page.getByRole("heading", { name: "Live checkout execution" })).toBeVisible();
  await expect(page.getByTestId("live-log")).toContainText(/CI stub mode|deterministic generated checkout artifact/, { timeout: 20_000 });
  await expect(page.getByTestId("live-run-complete")).toBeAttached({ timeout: 30_000 });
  await expect(page.getByTestId("live-score")).toContainText(/\d+\/\d+/);
  await expect(page.getByTestId("live-test-results")).toContainText("Integer cents math");

  await page.goto(`${baseURL}/leaderboard`);
  await expect(page.getByRole("heading", { name: "Fewer prompts. More passing tests." })).toBeVisible();
  await expect(page.getByText("#1").first()).toBeVisible();
  await expect(page.getByText("Expert ecommerce spec").first()).toBeVisible();
});

test("POST /api/runs classifies submissions and reports provider state", async ({ request }) => {
  const naive = await request.post(`${baseURL}/api/runs`, {
    data: { prompt: "Build an ecommerce checkout web app with cart items and promo codes." },
  });
  await expect(naive).toBeOK();
  const naivePayload = await naive.json();
  await expect(naivePayload).toMatchObject({ classification: "naive", runId: "naive-checkout", mode: "seeded-local-run" });
  expect(naivePayload.providerState).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "Sandbox", status: "connected", mode: "live" }),
      expect.objectContaining({ name: "Agnes AI", status: "connected", mode: "live" }),
      expect.objectContaining({ name: "TokenRouter", status: "connected", mode: "live" }),
    ]),
  );

  const structured = await request.post(`${baseURL}/api/runs`, {
    data: { prompt: "Use acceptance tests, edge cases, validation states, and clear error handling for checkout." },
  });
  await expect(structured).toBeOK();
  await expect(await structured.json()).toMatchObject({ classification: "structured", runId: "structured-checkout" });

  const expert = await request.post(`${baseURL}/api/runs`, {
    data: { prompt: "Build checkout with integer cents, case-insensitive promo normalization, stock limits, double-submit lock, shipping threshold order, negative discount floor, loading states, mobile layout, and aria labels." },
  });
  await expect(expert).toBeOK();
  const expertPayload = await expert.json();
  await expect(expertPayload).toMatchObject({ classification: "expert", runId: "expert-checkout" });
  expect(expertPayload.run.score.hiddenPassed).toBe(10);
});

test("POST /api/runs rejects empty prompts", async ({ request }) => {
  const response = await request.post(`${baseURL}/api/runs`, { data: { prompt: "   " } });
  expect(response.status()).toBe(400);
  await expect(await response.json()).toMatchObject({ error: expect.stringMatching(/Prompt must describe/) });
});

test("POST /api/live-runs creates a unique live run and completes in stub mode", async ({ request }) => {
  const response = await request.post(`${baseURL}/api/live-runs`, {
    data: { prompt: "Build checkout with integer cents, promo normalization, stock limits, double-submit lock, loading state, mobile aria labels." },
  });
  await expect(response).toBeOK();
  const created = await response.json();
  expect(created.runId).toMatch(/^live-/);

  let payload: { status?: string; score?: { passed: number; total: number }; events?: Array<{ message: string }> } | undefined;
  for (let index = 0; index < 30; index++) {
    const poll = await request.get(`${baseURL}/api/live-runs/${created.runId}`);
    await expect(poll).toBeOK();
    payload = await poll.json();
    if (payload?.status === "completed") break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  expect(payload?.status).toBe("completed");
  expect(payload?.score?.total).toBeGreaterThanOrEqual(9);
  expect(payload?.events?.some((event) => /CI stub mode|Playwright evaluation completed/.test(event.message))).toBe(true);
});

test("POST /api/generate-tests uses provider-mode boundary without real secrets in CI", async ({ request }) => {
  const response = await request.post(`${baseURL}/api/generate-tests`, {
    data: { specs: [{ title: "Promo codes trim and match case-insensitively" }] },
  });
  await expect(response).toBeOK();
  const payload = await response.json();
  await expect(payload).toMatchObject({
    mode: "live-provider",
    provider: expect.objectContaining({ name: "TokenRouter", status: "connected", mode: "live" }),
  });
  expect(payload.tests.length).toBeGreaterThan(0);
});
