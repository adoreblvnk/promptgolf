import type { WorkspaceManifest } from "./workspace";

export type CanonicalCapability = {
  key: string;
  kind: "route" | "control" | "output" | "command";
  confidence: "declared" | "observed";
  evidence: string;
};

export type CanonicalArtifact = {
  framework: string;
  capabilities: CanonicalCapability[];
};

/** Maps executable declarations to the canonical protocol. Runtime adapters observe product capabilities in the rendered artifact. */
export function adaptWorkspace(workspace: WorkspaceManifest): CanonicalArtifact {
  const capabilities: CanonicalCapability[] = [
    { key: "artifact.build", kind: "command", confidence: "declared", evidence: workspace.commands.build },
    { key: "artifact.start", kind: "command", confidence: "declared", evidence: workspace.commands.start },
    { key: "artifact.health", kind: "route", confidence: "declared", evidence: workspace.runtime.healthPath },
    { key: "artifact.preview", kind: "route", confidence: "declared", evidence: workspace.entrypoints.preview },
  ];
  return { framework: workspace.framework, capabilities };
}
