import { z } from "zod";

export const PROHIBITED_EVALUATOR_STRATEGIES = [
  "negative-testing",
  "mutation-testing",
  "implementation-fingerprint",
  "source-signature",
  "css-selector-fingerprint",
  "preferred-method",
] as const;

const observableSchema = z.object({
  capability: z.string().min(1),
  observation: z.string().min(1),
  protocolKey: z.string().min(1),
});

const methodSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("example"), examples: z.array(z.object({ input: z.unknown(), expected: z.unknown() })).min(1) }),
  z.object({ kind: z.literal("state-machine"), states: z.array(z.string().min(1)).min(2), traces: z.number().int().positive() }),
  z.object({ kind: z.literal("property"), property: z.string().min(1), cases: z.number().int().min(10) }),
  z.object({ kind: z.literal("requirement-tree"), requirementIds: z.array(z.string().min(1)).min(1) }),
  z.object({ kind: z.literal("artifact-discovery"), adapter: z.string().min(1) }),
]);

export const evalSpecSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  pillar: z.enum(["behavior", "spec-completeness", "artifact-adapter"]),
  requirementId: z.string().min(1),
  positiveClaim: z.string().min(1),
  methods: z.array(methodSchema).min(1),
  observables: z.array(observableSchema).min(1),
  strategy: z.enum(["positive-capability"]),
}).superRefine((value, context) => {
  const validKinds = value.pillar === "behavior"
    ? ["example", "state-machine", "property"]
    : value.pillar === "spec-completeness" ? ["requirement-tree"] : ["artifact-discovery"];
  if (!value.methods.some((method) => validKinds.includes(method.kind))) {
    context.addIssue({ code: "custom", path: ["methods"], message: `Pillar ${value.pillar} requires an aligned positive evidence method.` });
  }
});

export type EvalSpec = z.infer<typeof evalSpecSchema>;
export const capabilityEvidenceSchema = z.object({
  specId: z.string().min(1),
  requirementId: z.string().min(1),
  pillar: z.enum(["behavior", "spec-completeness", "artifact-adapter"]),
  status: z.enum(["satisfied", "partial", "unobserved"]),
  observations: z.array(z.object({
    protocolKey: z.string().min(1),
    summary: z.string().min(1),
    source: z.enum(["browser", "adapter", "requirement"]),
  })),
});
export type EvidenceStatus = z.infer<typeof capabilityEvidenceSchema>["status"];
export type CapabilityEvidence = z.infer<typeof capabilityEvidenceSchema>;

export function parseEvalSpec(input: unknown): EvalSpec {
  return evalSpecSchema.parse(input);
}

export function assertPositiveEvaluatorPolicy(input: unknown): void {
  const serialized = JSON.stringify(input).toLowerCase();
  const strategy = PROHIBITED_EVALUATOR_STRATEGIES.find((item) => serialized.includes(item));
  if (strategy) throw new Error(`Evaluator strategy '${strategy}' is prohibited. PromptGolf accepts positive capability evidence only.`);
  parseEvalSpec(input);
}

export function aggregatePositiveEvidence(specs: EvalSpec[], evidence: CapabilityEvidence[]) {
  const specById = new Map<string, EvalSpec>();
  for (const spec of specs) {
    parseEvalSpec(spec);
    if (specById.has(spec.id)) throw new Error(`Duplicate EvalSpec id '${spec.id}'.`);
    specById.set(spec.id, spec);
  }

  const bySpec = new Map<string, CapabilityEvidence>();
  for (const candidate of evidence) {
    const item = capabilityEvidenceSchema.parse(candidate);
    const spec = specById.get(item.specId);
    if (!spec) throw new Error(`Evidence references unknown EvalSpec '${item.specId}'.`);
    if (bySpec.has(item.specId)) throw new Error(`Duplicate evidence for EvalSpec '${item.specId}'.`);
    if (item.requirementId !== spec.requirementId || item.pillar !== spec.pillar) {
      throw new Error(`Evidence for '${item.specId}' does not match its requirement and pillar.`);
    }
    const allowedProtocolKeys = new Set(spec.observables.map((observable) => observable.protocolKey));
    if (item.observations.some((observation) => !allowedProtocolKeys.has(observation.protocolKey))) {
      throw new Error(`Evidence for '${item.specId}' contains an undeclared observable.`);
    }
    if (item.status !== "unobserved" && item.observations.length === 0) {
      throw new Error(`Positive evidence for '${item.specId}' requires an observation.`);
    }
    if (item.status === "unobserved" && item.observations.length > 0) {
      throw new Error(`Unobserved evidence for '${item.specId}' cannot contain observations.`);
    }
    const expectedSource = spec.pillar === "behavior" ? "browser" : spec.pillar === "artifact-adapter" ? "adapter" : "requirement";
    if (item.observations.some((observation) => observation.source !== expectedSource)) {
      throw new Error(`Evidence for '${item.specId}' must use ${expectedSource} observations for the ${spec.pillar} pillar.`);
    }
    const observedKeys = item.observations.map((observation) => observation.protocolKey);
    if (new Set(observedKeys).size !== observedKeys.length) {
      throw new Error(`Evidence for '${item.specId}' contains duplicate observations.`);
    }
    bySpec.set(item.specId, item);
  }
  const requirements = specs.map((spec) => ({ spec, evidence: bySpec.get(spec.id) }));
  const earned = requirements.reduce((total, item) => total + (item.evidence?.status === "satisfied" ? 1 : item.evidence?.status === "partial" ? 0.5 : 0), 0);
  return {
    earned,
    possible: specs.length,
    score: specs.length ? Math.round((earned / specs.length) * 100) : 0,
    requirements,
  };
}
