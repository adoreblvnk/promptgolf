import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: "PROMPTGOLF_TEST_PROVIDER_STUBS=1 DAYTONA_API_KEY=test-daytona-key TOKENROUTER_API_KEY=test-tokenrouter-key AGNES_AI_API_KEY=test-agnes-key npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
