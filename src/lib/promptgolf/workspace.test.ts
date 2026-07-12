import { describe, expect, it } from "vitest";
import { adaptWorkspace } from "./artifact-adapter";
import { deterministicCheckoutWorkspace } from "./live-run-fixture";
import { parseWorkspace, workspaceSummary } from "./workspace";

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    ...deterministicCheckoutWorkspace(),
    ...overrides,
  };
}

describe("workspace manifests", () => {
  it("accepts the deterministic framework project and summarizes executable metadata", () => {
    const workspace = parseWorkspace(deterministicCheckoutWorkspace());

    expect(workspace.files).toHaveLength(4);
    expect(workspaceSummary(workspace)).toContain("build: npm run build");
    expect(workspaceSummary(workspace)).toContain("start: npm start");
  });

  it.each([
    "/etc/passwd",
    "../secret",
    "src/../../secret",
    "src\\index.html",
    "C:/Windows/system.ini",
    "./src/index.html",
    "src//index.html",
  ])("rejects unsafe or non-portable file path %s", (unsafePath) => {
    const fixture = deterministicCheckoutWorkspace();
    const files = fixture.files.map((file, index) => index === 0 ? { ...file, path: unsafePath } : file);

    expect(() => parseWorkspace(manifest({ files }))).toThrow(/normalized portable relative paths|entrypoints/i);
  });

  it("rejects duplicate paths even when both entries are otherwise valid", () => {
    const fixture = deterministicCheckoutWorkspace();

    expect(() => parseWorkspace(manifest({ files: [...fixture.files, fixture.files[0]] }))).toThrow("Duplicate workspace path: package.json");
  });

  it("requires preview and manifest entrypoints to reference uploaded files", () => {
    expect(() => parseWorkspace(manifest({
      entrypoints: { preview: "dist/missing.html", manifest: "package.json" },
    }))).toThrow("Workspace entrypoints must reference included files");
  });
});

describe("artifact adaptation", () => {
  it("maps observable semantic controls and executable declarations to canonical capabilities", () => {
    const artifact = adaptWorkspace(parseWorkspace(deterministicCheckoutWorkspace()));
    const capabilities = new Map(artifact.capabilities.map((capability) => [capability.key, capability]));

    expect(capabilities.get("artifact.build")).toMatchObject({ kind: "command", confidence: "declared" });
    expect(capabilities.get("artifact.health")).toMatchObject({ kind: "route", evidence: "/health" });
    expect(capabilities.get("checkout.promo.input")).toMatchObject({ kind: "control", confidence: "observed" });
    expect(capabilities.get("checkout.submit")).toMatchObject({ kind: "control", confidence: "observed" });
    expect(capabilities.get("checkout.total")).toMatchObject({ kind: "output", confidence: "observed" });
  });

  it("does not infer product capabilities from source layout or framework metadata", () => {
    const fixture = deterministicCheckoutWorkspace();
    const files = fixture.files.map((file) => file.path === fixture.entrypoints.preview
      ? { ...file, content: "<!doctype html><html><body><main>Welcome</main></body></html>" }
      : file);
    const artifact = adaptWorkspace(parseWorkspace(manifest({ files })));

    expect(artifact.capabilities.map((capability) => capability.key)).toEqual([
      "artifact.build",
      "artifact.start",
      "artifact.health",
    ]);
  });
});
