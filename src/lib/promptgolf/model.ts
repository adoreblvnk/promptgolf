export const OPENAI_BUILDER_MODEL = "gpt-5.4-mini";
export const OPENAI_VISUAL_JUDGE_MODEL = "gpt-5.4-mini";
export const OPENAI_DIAGNOSIS_MODEL = "gpt-5.4-mini";
export const OPENAI_OFFLINE_EVALSPEC_MODEL = "gpt-5.5";

export function getModelPolicy() {
  return {
    liveProvider: "OpenAI AI SDK v6",
    builderModel: OPENAI_BUILDER_MODEL,
    visualJudgeModel: OPENAI_VISUAL_JUDGE_MODEL,
    diagnosisModel: OPENAI_DIAGNOSIS_MODEL,
    offlineEvalSpecModel: OPENAI_OFFLINE_EVALSPEC_MODEL,
    package: "@ai-sdk/openai",
    requiredEnv: ["OPENAI_API_KEY", "DAYTONA_API_KEY"],
    behaviorGrading: "Playwright deterministic checks",
    fallback: false,
    note: "Live runs use OpenAI through the AI SDK and Daytona sandboxes only. Stored EvalSpecs are not regenerated during contestant runs, and failed artifacts are recorded honestly.",
  };
}
