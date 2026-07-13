import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const webServerPort = new URL(baseURL).port || (baseURL.startsWith("https:") ? "443" : "80");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: `PORT=${webServerPort} PROMPTGOLF_TEST_PROVIDER_STUBS=1 DAYTONA_API_KEY=test-daytona-key TOKENROUTER_API_KEY=test-tokenrouter-key AGNES_AI_API_KEY=test-agnes-key npm run dev`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
