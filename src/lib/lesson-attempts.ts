import { ExerciseResult, LessonAttempt } from "@/types/learning";
import { calculateLessonMetrics, lessonPassed } from "./evaluation";

export interface CreateLessonAttemptInput {
  userId: string;
  lessonId: string;
  moduleId: string;
  level: string;
  results: ExerciseResult[];
  totalDurationMs: number;
  startedAt: string;
  finishedAt?: string;
  completed: boolean;
  xpMultiplier?: number;
}

export function createLessonAttempt(input: CreateLessonAttemptInput): LessonAttempt {
  const { accuracy, score, firstTryCorrect, itemsAnswered } = calculateLessonMetrics(input.results);
  const passed = input.completed && lessonPassed(input.results);
  const xpEarned = passed ? Math.max(10, Math.round(score * 0.5)) : 0;

  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    lessonId: input.lessonId,
    moduleId: input.moduleId,
    level: input.level,
    results: input.results,
    totalDurationMs: Math.max(0, input.totalDurationMs),
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    firstTryCorrect,
    itemsAnswered,
    passed,
    completed: input.completed,
    accuracy,
    score,
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
    results: JSON.stringify(attempt.results),
    total_duration_ms: attempt.totalDurationMs,
    started_at: attempt.startedAt,
    finished_at: attempt.finishedAt,
    first_try_correct: attempt.firstTryCorrect,
    items_answered: attempt.itemsAnswered,
    passed: attempt.passed,
    completed: attempt.completed,
    accuracy: attempt.accuracy,
    score: attempt.score,
    xp_earned: attempt.xpEarned,
  };
}

export function dbRowToAttempt(row: Record<string, unknown>): LessonAttempt {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    lessonId: String(row.lesson_id),
    moduleId: String(row.module_id),
    level: String(row.level),
    results: (Array.isArray(row.results) ? row.results : JSON.parse(String(row.results ?? "[]"))) as ExerciseResult[],
    totalDurationMs: Number(row.total_duration_ms ?? 0),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at ? String(row.finished_at) : undefined,
    firstTryCorrect: Number(row.first_try_correct ?? 0),
    itemsAnswered: Number(row.items_answered ?? 0),
    passed: Boolean(row.passed),
    completed: Boolean(row.completed),
    accuracy: Number(row.accuracy ?? 0),
    score: Number(row.score ?? 0),
    xpEarned: Number(row.xp_earned ?? 0),
  };
}
