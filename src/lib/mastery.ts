import { ExerciseResult, ExerciseResultStatus, LessonAttempt } from "@/types/learning";

export interface MasteryPassConfig {
  /** Minimum fraction of items that must be answered correctly on first try. */
  minAccuracy: number;
  /** Minimum number of items that must be answered. */
  minItems: number;
  /** Maximum allowed wrong-form answers. */
  maxWrongFormRatio: number;
  /** If true, an all-wrong attempt can never pass regardless of length. */
  rejectAllWrong: boolean;
}

export const DEFAULT_MASTERY_PASS_CONFIG: MasteryPassConfig = {
  minAccuracy: 0.7,
  minItems: 3,
  maxWrongFormRatio: 0.25,
  rejectAllWrong: true,
};

const WEIGHTS: Record<ExerciseResultStatus, number> = {
  correct: 1,
  typo: 1,
  "wrong-form": 0.25,
  wrong: 0,
  skipped: 0,
};

export function evaluateMasteryPass(
  results: ExerciseResult[],
  config: MasteryPassConfig = DEFAULT_MASTERY_PASS_CONFIG
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (results.length < config.minItems) {
    reasons.push(`Not enough items answered (${results.length}/${config.minItems}).`);
    return { passed: false, reasons };
  }

  if (config.rejectAllWrong && results.every((r) => r.status === "wrong" || r.status === "skipped")) {
    reasons.push("All answers were wrong or skipped.");
    return { passed: false, reasons };
  }

  const firstTryCorrect = results.filter((r) => r.status === "correct" || r.status === "typo").length;
  const accuracy = results.length === 0 ? 0 : firstTryCorrect / results.length;
  if (accuracy < config.minAccuracy) {
    reasons.push(`Accuracy ${(accuracy * 100).toFixed(0)}% is below required ${(config.minAccuracy * 100).toFixed(0)}%.`);
  }

  const wrongFormCount = results.filter((r) => r.status === "wrong-form").length;
  const wrongFormRatio = results.length === 0 ? 0 : wrongFormCount / results.length;
  if (wrongFormRatio > config.maxWrongFormRatio) {
    reasons.push(`Too many wrong-form answers (${(wrongFormRatio * 100).toFixed(0)}%).`);
  }

  const passed = reasons.length === 0;
  if (passed) {
    reasons.push("Mastery criteria met.");
  }
  return { passed, reasons };
}

export function attemptPassedMastery(
  attempt: LessonAttempt,
  config?: MasteryPassConfig
): { passed: boolean; reasons: string[] } {
  return evaluateMasteryPass(attempt.results, config);
}

export function calculateWeightedScore(results: ExerciseResult[]): number {
  if (results.length === 0) return 0;
  const raw = results.reduce((sum, r) => sum + WEIGHTS[r.status], 0) / results.length;
  return Math.round(raw * 100);
}
