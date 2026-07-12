import { z } from "zod";

const relativePath = z.string().min(1).refine((value) => !value.startsWith("/") && !value.split("/").includes(".."), "Workspace paths must be relative and cannot traverse parents.");

export const workspaceManifestSchema = z.object({
  schemaVersion: z.literal(1),
  framework: z.string().min(1),
  language: z.string().min(1),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun", "pip", "poetry", "composer"]),
  files: z.array(z.object({ path: relativePath, content: z.string() })).min(2).max(200),
  commands: z.object({ install: z.string().min(1).optional(), build: z.string().min(1), start: z.string().min(1) }),
  runtime: z.object({ port: z.number().int().min(1024).max(65535), healthPath: z.string().startsWith("/") }),
  entrypoints: z.object({ preview: relativePath, manifest: relativePath }),
});

export type WorkspaceManifest = z.infer<typeof workspaceManifestSchema>;
export type BuilderStatus = "connected" | "degraded" | "unavailable" | "fixture";
export type BuilderResult = { workspace: WorkspaceManifest; status: BuilderStatus; provider: string; model?: string; note: string };

export interface ProjectBuilder {
  build(input: { prompt: string; framework?: string }): Promise<BuilderResult>;
}

export function parseWorkspace(input: unknown): WorkspaceManifest {
  const workspace = workspaceManifestSchema.parse(input);
  const paths = new Set<string>();
  for (const file of workspace.files) {
    if (paths.has(file.path)) throw new Error(`Duplicate workspace path: ${file.path}`);
    paths.add(file.path);
  }
  if (!paths.has(workspace.entrypoints.preview) || !paths.has(workspace.entrypoints.manifest)) throw new Error("Workspace entrypoints must reference included files.");
  return workspace;
}

export function workspaceFile(workspace: WorkspaceManifest, path: string) {
  return workspace.files.find((file) => file.path === path)?.content;
}

export function workspaceSummary(workspace: WorkspaceManifest) {
  return `${workspace.framework} · ${workspace.files.length} files · build: ${workspace.commands.build} · start: ${workspace.commands.start}`;
}
