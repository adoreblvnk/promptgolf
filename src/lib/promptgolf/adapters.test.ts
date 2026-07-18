import { afterEach, describe, expect, it, vi } from "vitest";
import { getDoublewordAdapterStatus, getProviderStatuses } from "./adapters";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Doubleword adapter status", () => {
  it("reports the configured post-score diagnosis boundary", () => {
    vi.stubEnv("DOUBLEWORD_API_KEY", "test-doubleword-key");

    expect(getDoublewordAdapterStatus()).toMatchObject({
      name: "Doubleword",
      role: "post-score prompt diagnosis",
      mode: "live",
      model: "Qwen/Qwen3.5-35B-A3B-FP8",
    });
    expect(getProviderStatuses().map((provider) => provider.name)).toContain("Doubleword");
  });

  it("fails diagnosis availability honestly when the key is absent", () => {
    vi.stubEnv("DOUBLEWORD_API_KEY", "");

    expect(getDoublewordAdapterStatus()).toMatchObject({
      name: "Doubleword",
      mode: "unavailable",
    });
  });
});
