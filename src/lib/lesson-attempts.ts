import { ExerciseResult, LessonAttempt, RequiredExerciseGroup } from "@/types/learning";
import { calculateLessonMetrics, evaluateLessonOutcome } from "./evaluation";
import { calculateLearningXp } from "./learning-xp";

export interface CreateLessonAttemptInput {
  id?: string;
  userId: string;
  lessonId: string;
  moduleId: string;
  level: string;
  results: ExerciseResult[];
  totalDurationMs: number;
  startedAt: string;
  finishedAt?: string;
  completed: boolean;
  requiredScore: number;
  requiresProductive?: boolean;
  requiredExerciseGroups?: RequiredExerciseGroup[];
  masteryScore?: number;
}

export function createLessonAttempt(input: CreateLessonAttemptInput): LessonAttempt {
  const metrics = calculateLessonMetrics(input.results);
  const outcome = evaluateLessonOutcome(input.results, {
    completed: input.completed,
    requiredScore: input.requiredScore,
    requiresProductive: input.requiresProductive,
    requiredExerciseGroups: input.requiredExerciseGroups,
    masteryScore: input.masteryScore,
  });
  const totalDurationMs = Math.max(0, input.totalDurationMs);
  const activeTimeSeconds = Math.round(totalDurationMs / 1000);
  const xpEarned = calculateLearningXp({
    passed: outcome.passed,
    mastered: outcome.mastered,
    activeTimeSeconds,
    results: input.results,
  });

  return {
    id: input.id ?? crypto.randomUUID(),
    userId: input.userId,
    lessonId: input.lessonId,
    moduleId: input.moduleId,
    level: input.level,
    results: input.results,
    totalDurationMs,
    activeTimeSeconds,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    firstTryCorrect: metrics.firstTryCorrect,
    itemsAnswered: metrics.itemsAnswered,
    correctCount: metrics.correctCount,
    incorrectCount: metrics.incorrectCount,
    requiredScore: input.requiredScore,
    passed: outcome.passed,
    mastered: outcome.mastered,
    completed: input.completed,
    accuracy: metrics.accuracy,
    score: metrics.score,
    xpEarned,
  };
}

export function attemptToDbRow(attempt: LessonAttempt): Record<string, unknown> {
  return {
    id: attempt.id,
    user_id: attempt.userId,
    lesson_id: attempt.lessonId,
    module_id: attempt.moduleId,
    level: attempt.level,
    results: attempt.results,
    total_duration_ms: attempt.totalDurationMs,
    active_time_seconds: attempt.activeTimeSeconds,
    started_at: attempt.startedAt,
    finished_at: attempt.finishedAt,
    first_try_correct: attempt.firstTryCorrect,
    items_answered: attempt.itemsAnswered,
    correct_count: attempt.correctCount,
    incorrect_count: attempt.incorrectCount,
    required_score: attempt.requiredScore,
    passed: attempt.passed,
    mastered: attempt.mastered,
    completed: attempt.completed,
    accuracy: attempt.accuracy,
    score: attempt.score,
    xp_earned: attempt.xpEarned,
  };
}

export function dbRowToAttempt(row: Record<string, unknown>): LessonAttempt {
  const totalDurationMs = Number(row.total_duration_ms ?? 0);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    lessonId: String(row.lesson_id),
    moduleId: String(row.module_id),
    level: String(row.level),
    results: (Array.isArray(row.results) ? row.results : JSON.parse(String(row.results ?? "[]"))) as ExerciseResult[],
    totalDurationMs,
    activeTimeSeconds: Number(row.active_time_seconds ?? Math.round(totalDurationMs / 1000)),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at ? String(row.finished_at) : undefined,
    firstTryCorrect: Number(row.first_try_correct ?? 0),
    itemsAnswered: Number(row.items_answered ?? 0),
    correctCount: Number(row.correct_count ?? 0),
    incorrectCount: Number(row.incorrect_count ?? 0),
    requiredScore: Number(row.required_score ?? 70),
    passed: Boolean(row.passed),
    mastered: Boolean(row.mastered),
    completed: Boolean(row.completed),
    accuracy: Number(row.accuracy ?? 0),
    score: Number(row.score ?? 0),
    xpEarned: Number(row.xp_earned ?? 0),
  };
}
