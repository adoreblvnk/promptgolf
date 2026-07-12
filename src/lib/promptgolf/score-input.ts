import { z } from "zod";
import type { TestResult } from "./scoring";

const MAX_SCORE_TESTS = 200;

const testResultSchema = z.object({
  id: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  category: z.enum(["public", "hidden"]),
  passed: z.boolean(),
  note: z.string().max(1000),
}).strict();

const scoreInputSchema = z.object({
  tests: z.array(testResultSchema).max(MAX_SCORE_TESTS),
  uxScore: z.number().finite().min(0).max(10).default(7),
  promptCount: z.number().int().min(1).max(100).default(1),
}).strict();

export type ValidScoreInput = {
  tests: TestResult[];
  uxScore: number;
  promptCount: number;
};

export type ScoreInputResult =
  | { success: true; data: ValidScoreInput }
  | { success: false; message: string };

/** Keeps the public scoring helper deterministic and bounded at its HTTP trust boundary. */
export function validateScoreInput(input: unknown): ScoreInputResult {
  const parsed = scoreInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: `Score input must contain at most ${MAX_SCORE_TESTS} valid test results, a UX score from 0 to 10, and a prompt count from 1 to 100.`,
    };
  }
  return { success: true, data: parsed.data };
}
