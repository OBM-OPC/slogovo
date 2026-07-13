import { ExerciseResult, LessonAttempt } from "@/types/learning";
import { calculateLessonMetrics, evaluateLessonOutcome } from "./evaluation";

export interface MasteryPassConfig {
  minAccuracy: number;
  minItems: number;
  maxWrongFormRatio: number;
  rejectAllWrong: boolean;
}

export const DEFAULT_MASTERY_PASS_CONFIG: MasteryPassConfig = {
  minAccuracy: 0.9,
  minItems: 1,
  maxWrongFormRatio: 0.25,
  rejectAllWrong: true,
};

export function evaluateMasteryPass(
  results: ExerciseResult[],
  config: MasteryPassConfig = DEFAULT_MASTERY_PASS_CONFIG
): { passed: boolean; reasons: string[] } {
  const metrics = calculateLessonMetrics(results);
  const outcome = evaluateLessonOutcome(results, {
    completed: true,
    requiredScore: Math.round(config.minAccuracy * 100),
    masteryScore: Math.round(config.minAccuracy * 100),
  });
  const reasons = [...outcome.reasons];
  if (metrics.itemsAnswered < config.minItems) {
    reasons.push(`Not enough items answered (${metrics.itemsAnswered}/${config.minItems}).`);
  }
  const passed = outcome.mastered && metrics.itemsAnswered >= config.minItems;
  return { passed, reasons: passed ? ["Mastery criteria met."] : reasons };
}

export function attemptPassedMastery(attempt: LessonAttempt): { passed: boolean; reasons: string[] } {
  return attempt.mastered
    ? { passed: true, reasons: ["Mastery criteria met."] }
    : { passed: false, reasons: ["Attempt did not meet mastery criteria."] };
}

export function calculateWeightedScore(results: ExerciseResult[]): number {
  return calculateLessonMetrics(results).score;
}
