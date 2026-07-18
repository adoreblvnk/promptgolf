export const OPENAI_BUILDER_MODEL = "gpt-5.4-mini";
export const OPENAI_VISUAL_JUDGE_MODEL = "gpt-5.4-mini";
export const DOUBLEWORD_DIAGNOSIS_MODEL = process.env.DOUBLEWORD_MODEL?.trim() || "Qwen/Qwen3.5-35B-A3B-FP8";
export const OPENAI_OFFLINE_EVALSPEC_MODEL = "gpt-5.5";

export function getModelPolicy() {
  return {
    liveProvider: "OpenAI + Doubleword via AI SDK v6",
    builderModel: OPENAI_BUILDER_MODEL,
    visualJudgeModel: OPENAI_VISUAL_JUDGE_MODEL,
    diagnosisModel: DOUBLEWORD_DIAGNOSIS_MODEL,
    offlineEvalSpecModel: OPENAI_OFFLINE_EVALSPEC_MODEL,
    packages: ["@ai-sdk/openai", "@doubleword/vercel-ai"],
    requiredEnv: ["OPENAI_API_KEY", "DAYTONA_API_KEY", "DOUBLEWORD_API_KEY"],
    behaviorGrading: "Playwright deterministic checks",
    fallback: false,
    note: "OpenAI builds and visually judges the app, Daytona executes it in isolation, and Doubleword diagnoses the prompt after score lock. Stored EvalSpecs are not regenerated during contestant runs.",
  };
}
