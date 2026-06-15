export type TestResult = {
  id: string;
  label: string;
  category: "public" | "hidden";
  passed: boolean;
  note: string;
};

export type ScoreBreakdown = {
  publicPassed: number;
  publicTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  uxScore: number;
  promptCount: number;
  promptEfficiency: number;
  finalScore: number;
};

export function scoreRun(tests: TestResult[], uxScore: number, promptCount: number): ScoreBreakdown {
  const publicTests = tests.filter((test) => test.category === "public");
  const hiddenTests = tests.filter((test) => test.category === "hidden");
  const publicPassed = publicTests.filter((test) => test.passed).length;
  const hiddenPassed = hiddenTests.filter((test) => test.passed).length;
  const publicRatio = publicPassed / Math.max(publicTests.length, 1);
  const hiddenRatio = hiddenPassed / Math.max(hiddenTests.length, 1);
  const uxRatio = uxScore / 10;
  const promptEfficiency = Math.max(0, Math.min(10, 11 - promptCount));

  return {
    publicPassed,
    publicTotal: publicTests.length,
    hiddenPassed,
    hiddenTotal: hiddenTests.length,
    uxScore,
    promptCount,
    promptEfficiency,
    finalScore: Math.round((publicRatio * 35 + hiddenRatio * 40 + uxRatio * 15 + (promptEfficiency / 10) * 10) * 10) / 10,
  };
}
