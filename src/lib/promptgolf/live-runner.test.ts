import { afterEach, describe, expect, it, vi } from "vitest";
import { getDoublewordAdapterStatus } from "./adapters";
import { builderLoopShouldStop, builderRequiredTool, dependenciesChangedAfterInstall, diagnosePromptWithDoubleword, getSignedDaytonaPreviewUrl, invalidatedBuilderEvidence, probePreview, SIGNED_PREVIEW_EXPIRY_SECONDS } from "./live-runner";
import { createLiveRun, deleteLiveRun, getLiveRun, updateLiveRun } from "./live-run-store";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("builder loop state", () => {
  it("stops only after verified finalization, not merely after a rejected finalize call", () => {
    expect(builderLoopShouldStop(false)).toBe(false);
    expect(builderLoopShouldStop(true)).toBe(true);
  });

  it("invalidates build and runtime evidence after a workspace write", () => {
    expect(invalidatedBuilderEvidence()).toEqual({
      buildSucceeded: false,
      appStarted: false,
      healthVerified: false,
      previewVerified: false,
    });
  });

  it("reserves successful post-build steps for start, health, preview, and finalization", () => {
    const base = { buildSucceeded: true, appStarted: false, healthVerified: false, previewVerified: false, healthCheckAttempted: false, previewCheckAttempted: false };

    expect(builderRequiredTool(base)).toBe("start_app");
    expect(builderRequiredTool({ ...base, appStarted: true })).toBe("verify_health");
    expect(builderRequiredTool({ ...base, appStarted: true, healthVerified: true })).toBe("verify_preview");
    expect(builderRequiredTool({ ...base, appStarted: true, healthVerified: true, previewVerified: true })).toBe("finalize");
  });

  it("returns repair control to the builder after a failed verification attempt", () => {
    expect(builderRequiredTool({
      buildSucceeded: true,
      appStarted: true,
      healthVerified: false,
      previewVerified: false,
      healthCheckAttempted: true,
      previewCheckAttempted: false,
    })).toBeUndefined();
  });

  it("locks dependency ranges after installation while allowing script repairs", () => {
    const installed = JSON.stringify({ dependencies: { next: "16.2.9", react: "19.2.4" }, scripts: { build: "next build" } });
    const scriptRepair = JSON.stringify({ dependencies: { next: "16.2.9", react: "19.2.4" }, scripts: { build: "next build --webpack" } });
    const versionRewrite = JSON.stringify({ dependencies: { next: "16.2.10", react: "19.2.4" }, scripts: { build: "next build" } });

    expect(dependenciesChangedAfterInstall(installed, scriptRepair)).toBe(false);
    expect(dependenciesChangedAfterInstall(installed, versionRewrite)).toBe(true);
    expect(dependenciesChangedAfterInstall(installed, "not json")).toBe(true);
  });
});

describe("sandbox preview readiness probe", () => {
  it("accepts a bounded successful HTML document", async () => {
    const fetcher = vi.fn(async () => new Response("<!doctype html><html><body>ready</body></html>"));

    await expect(probePreview("https://sandbox.example", fetcher as typeof fetch)).resolves.toEqual({
      ready: true,
      observation: "HTML preview is ready",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://sandbox.example",
      expect.objectContaining({ cache: "no-store", redirect: "manual", signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects an authentication redirect instead of accepting Auth0 HTML", async () => {
    const fetcher = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "https://daytonaio.us.auth0.com/u/login" },
    }));

    await expect(probePreview("https://3000-private.daytonaproxy01.net", fetcher as typeof fetch)).resolves.toEqual({
      ready: false,
      observation: "preview redirected instead of serving the app to daytonaio.us.auth0.com",
    });
  });

  it("rejects oversized preview bodies without retaining them", async () => {
    const fetcher = vi.fn(async () => new Response("x", { headers: { "content-length": String(512 * 1024 + 1) } }));

    const result = await probePreview("https://sandbox.example", fetcher as typeof fetch);

    expect(result.ready).toBe(false);
    expect(result.observation).toContain("exceeded the size limit");
  });

  it("does not accept a successful non-HTML response", async () => {
    const fetcher = vi.fn(async () => new Response("service starting", { status: 200 }));

    await expect(probePreview("https://sandbox.example", fetcher as typeof fetch)).resolves.toEqual({
      ready: false,
      observation: "HTTP 200; body: service starting",
    });
  });
});

describe("Daytona signed preview URL", () => {
  it("requires a signed response and requests the explicit safe expiry", async () => {
    const getSignedPreviewUrl = vi.fn(async () => ({
      url: "https://3000-signed-token.daytonaproxy01.net",
      token: "signed-token",
    }));

    await expect(getSignedDaytonaPreviewUrl({ getSignedPreviewUrl }, 3000)).resolves.toEqual(
      new URL("https://3000-signed-token.daytonaproxy01.net"),
    );
    expect(getSignedPreviewUrl).toHaveBeenCalledWith(3000, SIGNED_PREVIEW_EXPIRY_SECONDS);
    expect(SIGNED_PREVIEW_EXPIRY_SECONDS).toBe(3600);
  });

  it.each([
    undefined,
    { url: "https://3000-private.daytonaproxy01.net" },
    { url: "https://3000-private.daytonaproxy01.net", token: "" },
  ])("rejects a standard or malformed preview response %#", async (preview) => {
    const getSignedPreviewUrl = vi.fn(async () => preview);
    await expect(getSignedDaytonaPreviewUrl({ getSignedPreviewUrl }, 3000)).rejects.toThrow(/signed preview URL/i);
  });
});

describe("Doubleword post-score diagnosis", () => {
  const tests = [
    { id: "hidden-rule", label: "Hidden rule", category: "hidden" as const, passed: false, note: "Missing domain rule" },
  ];
  const score = {
    passed: 0,
    total: 1,
    finalScore: 0,
    categories: [
      { category: "functional" as const, label: "Functional", passed: 0, total: 0, score: 0 },
      { category: "hidden" as const, label: "Hidden", passed: 0, total: 1, score: 0 },
      { category: "style" as const, label: "UI/UX", passed: 0, total: 0, score: 0 },
    ],
  };

  function createDiagnosableRun() {
    const run = createLiveRun({ prompt: "Build checkout", challengeSlug: "mini-checkout-promo-engine" });
    updateLiveRun(run.id, {
      score,
      providerState: [{ ...getDoublewordAdapterStatus(), status: "pending" }],
    });
    return run;
  }

  it("marks a successful structured diagnosis connected without changing the locked score", async () => {
    vi.stubEnv("PROMPTGOLF_TEST_PROVIDER_STUBS", "0");
    vi.stubEnv("DOUBLEWORD_API_KEY", "test-doubleword-key");
    const run = createDiagnosableRun();
    const lockedScore = structuredClone(getLiveRun(run.id)?.score);
    const generated = vi.fn(async () => ({
      verdict: "technical" as const,
      promptingScore: 8,
      technicalScore: 4,
      summary: "The prompt is clear but omits domain rules.",
      promptingFeedback: "Keep the acceptance criteria.",
      technicalFeedback: "Add checkout domain boundaries.",
    }));

    await expect(diagnosePromptWithDoubleword(run.id, run.prompt, tests, score, generated)).resolves.toMatchObject({ verdict: "technical" });
    expect(generated).toHaveBeenCalledOnce();
    expect(getLiveRun(run.id)?.score).toEqual(lockedScore);
    expect(getLiveRun(run.id)?.providerState.find((provider) => provider.name === "Doubleword")).toMatchObject({ status: "connected", mode: "live" });
    deleteLiveRun(run.id);
  });

  it("degrades once with no fallback and preserves the locked score on provider failure", async () => {
    vi.stubEnv("PROMPTGOLF_TEST_PROVIDER_STUBS", "0");
    vi.stubEnv("DOUBLEWORD_API_KEY", "test-doubleword-key");
    const run = createDiagnosableRun();
    const lockedScore = structuredClone(getLiveRun(run.id)?.score);
    const generated = vi.fn(async () => {
      throw new Error("Malformed structured output");
    });

    await expect(diagnosePromptWithDoubleword(run.id, run.prompt, tests, score, generated)).resolves.toMatchObject({ verdict: "degraded" });
    expect(generated).toHaveBeenCalledOnce();
    expect(getLiveRun(run.id)?.score).toEqual(lockedScore);
    expect(getLiveRun(run.id)?.providerState.find((provider) => provider.name === "Doubleword")).toMatchObject({ status: "degraded", mode: "degraded" });
    deleteLiveRun(run.id);
  });
});
