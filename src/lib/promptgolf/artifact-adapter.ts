import type { WorkspaceManifest } from "./workspace";
import { workspaceFile } from "./workspace";

export type CanonicalCapability = {
  key: string;
  kind: "route" | "control" | "output" | "command";
  confidence: "declared" | "observed";
  evidence: string;
};

export type CanonicalArtifact = {
  framework: string;
  capabilities: CanonicalCapability[];
  previewContent?: string;
};

const semanticControls = [
  { key: "checkout.promo.input", terms: ["promo code", "coupon", "discount code"] },
  { key: "checkout.promo.apply", terms: ["apply", "redeem"] },
  { key: "checkout.submit", terms: ["confirm order", "checkout", "place order"] },
  { key: "checkout.total", terms: ["order total", ">total<", "amount due"] },
];

/** Maps framework output to protocol capabilities. It never grades source shape or preferred implementation. */
export function adaptWorkspace(workspace: WorkspaceManifest): CanonicalArtifact {
  const previewContent = workspaceFile(workspace, workspace.entrypoints.preview);
  const normalized = previewContent?.toLowerCase() ?? "";
  const capabilities: CanonicalCapability[] = [
    { key: "artifact.build", kind: "command", confidence: "declared", evidence: workspace.commands.build },
    { key: "artifact.start", kind: "command", confidence: "declared", evidence: workspace.commands.start },
    { key: "artifact.health", kind: "route", confidence: "declared", evidence: workspace.runtime.healthPath },
  ];
  for (const control of semanticControls) {
    const term = control.terms.find((candidate) => normalized.includes(candidate));
    if (term) capabilities.push({ key: control.key, kind: control.key.endsWith("total") ? "output" : "control", confidence: "observed", evidence: `Semantic text: ${term}` });
  }
  return { framework: workspace.framework, capabilities, previewContent };
}
