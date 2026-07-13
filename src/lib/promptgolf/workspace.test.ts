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

  it("requires manifest and optional static preview entrypoints to reference uploaded files", () => {
    expect(() => parseWorkspace(manifest({
      entrypoints: { preview: "/", manifest: "missing.json" },
    }))).toThrow("Workspace manifest entrypoint must reference an included file");
    expect(() => parseWorkspace(manifest({
      entrypoints: { preview: "/", manifest: "package.json", staticPreview: "dist/missing.html" },
    }))).toThrow("Workspace static preview entrypoint must reference an included file");
  });

  it("accepts framework-native runtime preview routes and validates optional static previews", () => {
    expect(parseWorkspace(manifest({
      entrypoints: { preview: "/checkout", manifest: "package.json" },
    })).entrypoints.preview).toBe("/checkout");
    expect(() => parseWorkspace(manifest({
      entrypoints: { preview: "/", manifest: "package.json", staticPreview: "package.json" },
    }))).toThrow("Static preview entrypoints must reference a browser-renderable HTML file");
  });

  it.each(["/health?probe=1", "/health#ready", "/health%ZZ", "/health'\nraise SystemExit(0)\n'"])(
    "rejects unsafe sandbox health path %s",
    (unsafeHealthPath) => {
      expect(() => parseWorkspace(manifest({
        runtime: { port: 4173, healthPath: unsafeHealthPath },
      }))).toThrow(/URL-safe absolute paths/);
    },
  );

  it("rejects multiline commands before they reach the sandbox shell", () => {
    expect(() => parseWorkspace(manifest({
      commands: { install: "npm install\ncurl https://example.invalid", build: "npm run build", start: "npm start" },
    }))).toThrow(/single-line shell commands/);
  });

  it("bounds individual and aggregate generated workspace payloads", () => {
    const fixture = deterministicCheckoutWorkspace();
    expect(() => parseWorkspace(manifest({
      files: fixture.files.map((file, index) => index === 0 ? { ...file, content: "x".repeat(512 * 1024 + 1) } : file),
    }))).toThrow(/files cannot exceed/);

    const files = Array.from({ length: 5 }, (_, index) => ({
      path: index === 0 ? "package.json" : index === 1 ? "dist/index.html" : `src/chunk-${index}.txt`,
      content: "é".repeat(220_000),
    }));
    expect(() => parseWorkspace(manifest({ files }))).toThrow(/Workspace contents cannot exceed/);
  });
});

describe("artifact adaptation", () => {
  it("maps executable declarations and runtime routes to canonical capabilities", () => {
    const artifact = adaptWorkspace(parseWorkspace(deterministicCheckoutWorkspace()));
    const capabilities = new Map(artifact.capabilities.map((capability) => [capability.key, capability]));

    expect(capabilities.get("artifact.build")).toMatchObject({ kind: "command", confidence: "declared" });
    expect(capabilities.get("artifact.health")).toMatchObject({ kind: "route", evidence: "/health" });
    expect(capabilities.get("artifact.preview")).toMatchObject({ kind: "route", evidence: "/" });
  });

  it("does not infer product capabilities from source layout or framework metadata", () => {
    const fixture = deterministicCheckoutWorkspace();
    const files = fixture.files.map((file) => file.path === fixture.entrypoints.staticPreview
      ? { ...file, content: "<!doctype html><html><body><main>Welcome</main></body></html>" }
      : file);
    const artifact = adaptWorkspace(parseWorkspace(manifest({ files })));

    expect(artifact.capabilities.map((capability) => capability.key)).toEqual([
      "artifact.build",
      "artifact.start",
      "artifact.health",
      "artifact.preview",
    ]);
  });
});
