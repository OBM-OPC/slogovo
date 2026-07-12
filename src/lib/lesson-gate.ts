import { ExerciseResult } from "@/types/learning";
import { calculateLessonMetrics, lessonPassed } from "./evaluation";
import { DEFAULT_MASTERY_PASS_CONFIG } from "./mastery";

export interface LessonGateConfig {
  minAccuracy: number;
  minItems: number;
}

export const DEFAULT_LESSON_GATE_CONFIG: LessonGateConfig = {
  minAccuracy: DEFAULT_MASTERY_PASS_CONFIG.minAccuracy, // 0.7
  minItems: DEFAULT_MASTERY_PASS_CONFIG.minItems, // 3
};

export interface LessonGateResult {
  passed: boolean;
  accuracy: number;
  firstTryCorrect: number;
  itemsAnswered: number;
  score: number;
  retryRecommended: boolean;
}

export function evaluateLessonGate(
  results: ExerciseResult[],
  config: LessonGateConfig = DEFAULT_LESSON_GATE_CONFIG
): LessonGateResult {
  const metrics = calculateLessonMetrics(results);
  const passed = lessonPassed(results, config.minAccuracy, config.minItems);
  const retryRecommended = !passed && metrics.accuracy < config.minAccuracy;

  return {
    passed,
    accuracy: metrics.accuracy,
    firstTryCorrect: metrics.firstTryCorrect,
    itemsAnswered: metrics.itemsAnswered,
    score: metrics.score,
    retryRecommended,
  };
}

export function isLessonMastered(
  bestAccuracy: number,
  bestScore: number,
  minAccuracy = DEFAULT_LESSON_GATE_CONFIG.minAccuracy,
  minScore = 80
): boolean {
  return bestAccuracy >= minAccuracy && bestScore >= minScore;
}
