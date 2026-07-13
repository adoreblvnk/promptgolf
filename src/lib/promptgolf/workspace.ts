import { z } from "zod";

const MAX_FILE_BYTES = 512 * 1024;
const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

const command = z.string().min(1).max(500).refine(
  (value) => !/[\0\r\n]/.test(value),
  "Workspace commands must be single-line shell commands without control characters.",
);

const fileContent = z.string().refine(
  (value) => Buffer.byteLength(value, "utf8") <= MAX_FILE_BYTES,
  `Workspace files cannot exceed ${MAX_FILE_BYTES} UTF-8 bytes.`,
);

const healthPath = z.string().min(1).max(200).regex(
  /^\/(?:[A-Za-z0-9._~!$&()*+,;=:@/-]|%[0-9A-Fa-f]{2})*$/,
  "Health paths must be URL-safe absolute paths without query strings, fragments, quotes, or whitespace.",
);

const relativePath = z.string().min(1).max(240).superRefine((value, context) => {
  const segments = value.split("/");
  const invalid =
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("\0") ||
    /^[a-z]:/i.test(value) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..");
  if (invalid) {
    context.addIssue({
      code: "custom",
      message: "Workspace paths must be normalized portable relative paths and cannot traverse parents.",
    });
  }
});

const previewPath = relativePath.refine(
  (value) => /\.html?$/i.test(value),
  "Workspace preview entrypoints must reference a browser-renderable HTML file.",
);

export const workspaceManifestSchema = z.object({
  schemaVersion: z.literal(1),
  framework: z.string().min(1),
  language: z.string().min(1),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun", "pip", "poetry", "composer"]),
  files: z.array(z.object({ path: relativePath, content: fileContent })).min(2).max(200),
  commands: z.object({ install: command.optional(), build: command, start: command }),
  runtime: z.object({ port: z.number().int().min(1024).max(65535), healthPath }),
  entrypoints: z.object({ preview: previewPath, manifest: relativePath }),
});

export type WorkspaceManifest = z.infer<typeof workspaceManifestSchema>;
export type BuilderStatus = "connected" | "degraded" | "unavailable" | "fixture";
export type BuilderResult = { workspace: WorkspaceManifest; status: BuilderStatus; provider: string; model?: string; note: string };

export interface ProjectBuilder {
  build(input: { prompt: string; framework?: string }): Promise<BuilderResult>;
}

export function parseWorkspace(input: unknown): WorkspaceManifest {
  const workspace = workspaceManifestSchema.parse(input);
  const totalBytes = workspace.files.reduce((total, file) => total + Buffer.byteLength(file.content, "utf8"), 0);
  if (totalBytes > MAX_WORKSPACE_BYTES) throw new Error(`Workspace contents cannot exceed ${MAX_WORKSPACE_BYTES} UTF-8 bytes.`);
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
