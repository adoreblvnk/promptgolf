import { z } from "zod";

export const MAX_TEST_DRAFT_SPECS = 20;
export const MAX_TEST_DRAFT_TITLE_LENGTH = 200;

const generateTestsInputSchema = z.object({
  specs: z.array(
    z.object({
      title: z.string().trim().min(1).max(MAX_TEST_DRAFT_TITLE_LENGTH),
    }).strict(),
  ).min(1).max(MAX_TEST_DRAFT_SPECS),
}).strict();

export type GenerateTestsInput = z.infer<typeof generateTestsInputSchema>;

export type GenerateTestsInputResult =
  | { success: true; data: GenerateTestsInput }
  | { success: false; message: string };

/** Bounds the public, provider-backed draft request before it can consume model tokens. */
export function validateGenerateTestsInput(input: unknown): GenerateTestsInputResult {
  const parsed = generateTestsInputSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };

  return {
    success: false,
    message: `Provide 1-${MAX_TEST_DRAFT_SPECS} specs with non-empty titles no longer than ${MAX_TEST_DRAFT_TITLE_LENGTH} characters.`,
  };
}
