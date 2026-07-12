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
export type EvidenceStatus = "satisfied" | "partial" | "unobserved";
export type CapabilityEvidence = {
  specId: string;
  requirementId: string;
  pillar: EvalSpec["pillar"];
  status: EvidenceStatus;
  observations: Array<{ protocolKey: string; summary: string; source: "browser" | "adapter" | "requirement" }>;
};

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
  const bySpec = new Map(evidence.map((item) => [item.specId, item]));
  const requirements = specs.map((spec) => ({ spec, evidence: bySpec.get(spec.id) }));
  const earned = requirements.reduce((total, item) => total + (item.evidence?.status === "satisfied" ? 1 : item.evidence?.status === "partial" ? 0.5 : 0), 0);
  return {
    earned,
    possible: specs.length,
    score: specs.length ? Math.round((earned / specs.length) * 100) : 0,
    requirements,
  };
}
