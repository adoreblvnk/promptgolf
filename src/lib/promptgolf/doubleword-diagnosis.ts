import { createDoublewordAsync } from "@doubleword/vercel-ai";
import { generateObject } from "ai";
import { z } from "zod";
import type { LiveRunSkillDiagnosis } from "./live-run-store";
import { DOUBLEWORD_DIAGNOSIS_MODEL } from "./model";

const DOUBLEWORD_DIAGNOSIS_TIMEOUT_MS = 300_000;

const SkillDiagnosisSchema = z.object({
  verdict: z.enum(["prompting", "technical", "balanced"]),
  promptingScore: z.number().int().min(0).max(10),
  technicalScore: z.number().int().min(0).max(10),
  summary: z.string().min(1).max(220),
  promptingFeedback: z.string().min(1).max(180),
  technicalFeedback: z.string().min(1).max(180),
});

export async function generateDoublewordDiagnosis(input: { system: string; prompt: string }): Promise<LiveRunSkillDiagnosis> {
  const doubleword = createDoublewordAsync({
    batchSize: 1,
    batchWindowSeconds: 1,
    pollIntervalSeconds: 2,
  });

  try {
    const result = await generateObject({
      model: doubleword(DOUBLEWORD_DIAGNOSIS_MODEL),
      schema: SkillDiagnosisSchema,
      system: input.system,
      prompt: input.prompt,
      maxOutputTokens: 700,
      maxRetries: 0,
      timeout: DOUBLEWORD_DIAGNOSIS_TIMEOUT_MS,
    });
    return SkillDiagnosisSchema.parse(result.object);
  } finally {
    await doubleword.close();
  }
}
