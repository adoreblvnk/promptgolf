import { describe, expect, it } from "vitest";
import { adaptWorkspace } from "./artifact-adapter";
import { aggregatePositiveEvidence, assertPositiveEvaluatorPolicy, parseEvalSpec, type EvalSpec } from "./evaluation";
import { deterministicCheckoutWorkspace } from "./live-run-fixture";
import { parseWorkspace } from "./workspace";

const behavior: EvalSpec = {
  id: "promo-normalization",
  title: "Promo normalization",
  pillar: "behavior",
  requirementId: "checkout.promo.normalize",
  positiveClaim: "A shopper can apply a valid promo despite casing and outer whitespace.",
  strategy: "positive-capability",
  methods: [{ kind: "property", property: "trimmed case variants produce the same discount", cases: 50 }],
  observables: [{ capability: "discount applied", observation: "discount changes", protocolKey: "checkout.discount" }],
};

describe("positive EvalSpec policy", () => {
  it("accepts aligned positive capability specs", () => expect(parseEvalSpec(behavior).id).toBe("promo-normalization"));
  it.each(["negative-testing", "mutation-testing", "implementation-fingerprint", "css-selector-fingerprint", "preferred-method"])("rejects prohibited strategy %s", (strategy) => {
    expect(() => assertPositiveEvaluatorPolicy({ ...behavior, notes: strategy })).toThrow(/prohibited/);
  });
  it("requires a pillar-aligned method", () => expect(() => parseEvalSpec({ ...behavior, methods: [{ kind: "requirement-tree", requirementIds: ["x"] }] })).toThrow(/aligned/));
});

describe("positive evidence aggregation", () => {
  it("awards only observed positive evidence and preserves partial credit", () => {
    const second = { ...behavior, id: "checkout-submit", requirementId: "checkout.submit" };
    const result = aggregatePositiveEvidence([behavior, second], [
      { specId: behavior.id, requirementId: behavior.requirementId, pillar: "behavior", status: "satisfied", observations: [{ protocolKey: "checkout.discount", summary: "observed", source: "browser" }] },
      { specId: second.id, requirementId: second.requirementId, pillar: "behavior", status: "partial", observations: [] },
    ]);
    expect(result).toMatchObject({ earned: 1.5, possible: 2, score: 75 });
  });
});

describe("workspace and artifact adapter", () => {
  it("validates a buildable multi-file fixture", () => {
    const workspace = parseWorkspace(deterministicCheckoutWorkspace());
    expect(workspace.files.length).toBeGreaterThanOrEqual(4);
    expect(workspace.commands).toMatchObject({ build: "npm run build", start: "npm start" });
  });
  it("rejects traversal and duplicate paths", () => {
    const fixture = deterministicCheckoutWorkspace();
    expect(() => parseWorkspace({ ...fixture, files: [...fixture.files, { path: "../secret", content: "x" }] })).toThrow();
    expect(() => parseWorkspace({ ...fixture, files: [...fixture.files, fixture.files[0]] })).toThrow(/Duplicate/);
  });
  it.each([
    "/etc/passwd",
    "C:/Windows/system.ini",
    "..\\secret",
    "src\\index.html",
    "src//index.html",
    "./package.json",
    "src/./index.html",
    "src/../secret",
    "bad\0name",
  ])("rejects non-portable or unsafe workspace path %j", (unsafePath) => {
    const fixture = deterministicCheckoutWorkspace();
    expect(() => parseWorkspace({ ...fixture, files: [...fixture.files, { path: unsafePath, content: "x" }] })).toThrow(/normalized portable relative paths/);
  });
  it("requires both entrypoints to resolve to included safe files", () => {
    const fixture = deterministicCheckoutWorkspace();
    expect(() => parseWorkspace({ ...fixture, entrypoints: { ...fixture.entrypoints, preview: "dist/index.html" } })).toThrow(/entrypoints/);
    expect(() => parseWorkspace({ ...fixture, entrypoints: { ...fixture.entrypoints, manifest: "../package.json" } })).toThrow(/normalized portable relative paths/);
  });
  it("discovers semantic canonical capabilities without source fingerprints", () => {
    const artifact = adaptWorkspace(deterministicCheckoutWorkspace());
    expect(artifact.capabilities.map((item) => item.key)).toEqual(expect.arrayContaining(["artifact.build", "artifact.start", "checkout.promo.input", "checkout.submit", "checkout.total"]));
    expect(JSON.stringify(artifact.capabilities)).not.toContain("data-testid");
  });
});
