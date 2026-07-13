import { Exercise, ExerciseResult } from "@/types";
import { flattenExerciseResults } from "./evaluation";

export interface ExerciseRun {
  exercise: Exercise;
  attemptNumber: number;
  retry: boolean;
}

export function createInitialExerciseRuns(exercises: Exercise[]): ExerciseRun[] {
  return exercises.map((exercise) => ({ exercise, attemptNumber: 1, retry: false }));
}

export function createRetryRuns(
  exercise: Exercise,
  result: ExerciseResult,
  maxAttemptNumber = 3
): ExerciseRun[] {
  const byItem = new Map<string, ReturnType<typeof flattenExerciseResults>>();
  for (const item of flattenExerciseResults([result])) {
    const existing = byItem.get(item.itemId) ?? [];
    existing.push(item);
    byItem.set(item.itemId, existing);
  }
  const failed = [...byItem.values()]
    .filter((attempts) => attempts.some((item) => item.required) && !attempts.some((item) => item.isPassing))
    .map((attempts) => attempts.reduce((latest, item) => item.attemptNumber > latest.attemptNumber ? item : latest))
    .filter((item) => item.attemptNumber < maxAttemptNumber);
  return failed.map((item) => ({
    exercise: {
      ...exercise,
      data: (exercise.data as Array<{ id: string }>).filter((candidate) => candidate.id === item.itemId) as Exercise["data"],
    },
    attemptNumber: item.attemptNumber + 1,
    retry: true,
  }));
}

export function reachedFinalScreen(initialExerciseCount: number, completedInitialRuns: number): boolean {
  return initialExerciseCount > 0 && completedInitialRuns >= initialExerciseCount;
}
