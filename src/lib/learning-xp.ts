import type { ExerciseResult } from "@/types";
import { firstItemAttempts } from "@/lib/evaluation";

interface LearningXpInput {
  passed: boolean;
  mastered: boolean;
  activeTimeSeconds: number;
  results: ExerciseResult[];
}

/**
 * XP is a per-attempt explanation of demonstrated learning, not a spendable
 * currency. Repeated clicks and retries do not add items because only unique
 * first attempts are considered.
 */
export function calculateLearningXp(input: LearningXpInput): number {
  if (!input.passed || input.activeTimeSeconds <= 0) return 0;
  const firstAttempts = firstItemAttempts(input.results);
  if (firstAttempts.length === 0) return 0;
  const correct = firstAttempts.filter((item) => item.isPassing).length;
  const productive = firstAttempts.filter((item) => item.isPassing && item.productive).length;
  const activeMinutes = Math.min(15, Math.floor(input.activeTimeSeconds / 60));
  return correct * 2 + productive * 2 + activeMinutes + (input.mastered ? 10 : 0);
}
