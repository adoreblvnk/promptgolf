import { expect, test } from "@playwright/test";

test("landing comparator exposes tabs, keyboard selection, and live updates", async ({ page }) => {
  await page.goto("/");

  const tablist = page.getByRole("tablist", { name: "Specification quality" });
  const naive = tablist.getByRole("tab", { name: /Naive request/ });
  const structured = tablist.getByRole("tab", { name: /Structured spec/ });
  const expert = tablist.getByRole("tab", { name: /Domain-expert spec/ });
  const panel = page.getByRole("tabpanel");
  const announcement = page.locator('[aria-live="polite"]');

  await expect(tablist).toBeVisible();
  await expect(naive).toHaveAttribute("aria-selected", "true");
  await expect(naive).toHaveAttribute("tabindex", "0");
  await expect(structured).toHaveAttribute("tabindex", "-1");
  await expect(panel).toHaveAttribute("aria-labelledby", "spec-state-naive-checkout");
  await expect(panel.getByText("Happy-path checkout", { exact: true })).toBeVisible();

  await expect.poll(async () => {
    await structured.click();
    return structured.getAttribute("aria-selected");
  }).toBe("true");
  await naive.click();
  await expect(naive).toHaveAttribute("aria-selected", "true");

  await naive.focus();
  await naive.press("ArrowRight");
  await expect(structured).toBeFocused();
  await expect(structured).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAttribute("aria-labelledby", "spec-state-structured-checkout");
  await expect(announcement).toContainText("Showing Structured spec: 7 of 10 hidden checks passed with 2 prompts.");
  await expect(panel.getByText("Robust checkout shell", { exact: true })).toBeVisible();

  await structured.press("ArrowLeft");
  await expect(naive).toBeFocused();
  await naive.press("End");
  await expect(expert).toBeFocused();
  await expect(expert).toHaveAttribute("aria-selected", "true");
  await expect(announcement).toContainText("Showing Domain-expert spec: 10 of 10 hidden checks passed with 1 prompt.");
  await expect(panel.getByText("Production-aware checkout", { exact: true })).toBeVisible();

  await expert.press("Home");
  await expect(naive).toBeFocused();
  await expect(naive).toHaveAttribute("aria-selected", "true");
});

test("landing has no horizontal overflow at a true 390px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect.poll(() => page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentFits: document.documentElement.scrollWidth <= 390,
    bodyFits: document.body.scrollWidth <= 390,
  }))).toEqual({ innerWidth: 390, documentFits: true, bodyFits: true });
});

test("landing navigation stays named, tappable, and contained at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  const home = navigation.getByRole("link", { name: "PromptGolf home" });
  const destinations = [
    { name: "Problems", mobileLabel: "Problems" },
    { name: "Leaderboard", mobileLabel: "Leaders" },
    { name: "Runs", mobileLabel: "Runs" },
    { name: "Methodology", mobileLabel: "Method" },
  ];

  await expect(navigation).toBeVisible();
  await expect(home).toBeVisible();

  await expect.poll(async () => (await navigation.boundingBox())?.height).toBe(52);

  for (const { name, mobileLabel } of destinations) {
    const link = navigation.getByRole("link", { name });
    await expect(link).toBeVisible();
    await expect(link.locator("span").first()).toBeVisible();
    await expect(link.locator("span").first()).toHaveText(mobileLabel);
    await expect(link.locator("span").nth(1)).toBeHidden();
  }

  for (const link of [home, ...destinations.map(({ name }) => navigation.getByRole("link", { name }))]) {
    await expect.poll(async () => {
      const box = await link.boundingBox();
      return Boolean(box && box.height >= 44 && box.width >= 44);
    }).toBe(true);
  }

  await expect.poll(() => page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentFits: document.documentElement.scrollWidth <= 320,
    bodyFits: document.body.scrollWidth <= 320,
  }))).toEqual({ innerWidth: 320, documentFits: true, bodyFits: true });

  await page.setViewportSize({ width: 1024, height: 768 });
  const player = navigation.getByRole("link", { name: "Player 01" });
  await expect(player).toBeVisible();
  await expect.poll(async () => {
    const box = await player.boundingBox();
    return Boolean(box && box.height >= 44 && box.width >= 44);
  }).toBe(true);
});

test("landing comparator removes state-change motion when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("tab", { name: /Structured spec/ }).click();

  const motion = await page.getByRole("tabpanel").evaluate((element) => {
    const styles = getComputedStyle(element);
    return { animationName: styles.animationName, animationDuration: styles.animationDuration };
  });

  expect(motion.animationName).toBe("none");
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.00001);
});

test("landing run link opens a truthfully labeled seeded reference scorecard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Inspect reference scorecard" }).click();

  await expect(page).toHaveURL(/\/runs\/naive-checkout$/);
  await expect(page.getByText("Seeded reference · score fixed", { exact: true })).toBeVisible();
  await expect(page.getByText(/authored results demonstrate the scoring narrative under fixed reference conditions/)).toBeVisible();
  await expect(page.getByText("seeded checkout scenario · shared reference schematic", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reference scenario record" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Seeded reference scenario conditions" })).toBeVisible();
  await expect(page.getByText(/No provider, sandbox, builder, or Playwright job was freshly executed/)).toBeVisible();
  await expect(page.getByText("generated checkout preview", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Execution timeline" })).toHaveCount(0);
});
