import { z } from "zod";
import type { SyncEvent } from "./sync-queue";

const timestampSchema = z.string().datetime({ offset: true });
const exerciseStatusSchema = z.enum(["correct", "typo", "wrong-form", "wrong", "skipped"]);
const exerciseTypeSchema = z.enum([
  "quiz",
  "fill-in",
  "matching",
  "sentence-builder",
  "listen",
  "typing",
]);

const itemResultSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  status: exerciseStatusSchema,
  isPassing: z.boolean(),
  userAnswer: z.string().optional(),
  acceptedAnswers: z.array(z.string()),
  feedback: z.string().optional(),
  feedbackNeedsReview: z.boolean().optional(),
  durationMs: z.number().int().nonnegative(),
  startedAt: timestampSchema,
  completedAt: timestampSchema,
  attemptNumber: z.number().int().positive(),
  hintsUsed: z.number().int().nonnegative(),
  required: z.boolean(),
  productive: z.boolean(),
  vocabularyId: z.string().optional(),
});

const exerciseResultSchema = z.object({
  exerciseId: z.string().min(1),
  exerciseType: exerciseTypeSchema,
  correctAnswers: z.number().int().nonnegative(),
  incorrectAnswers: z.number().int().nonnegative(),
  attempts: z.number().int().nonnegative(),
  itemResults: z.array(itemResultSchema),
  hintsUsed: z.number().int().nonnegative(),
  startedAt: timestampSchema,
  completedAt: timestampSchema,
});

const lessonAttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  moduleId: z.string().min(1),
  level: z.string().min(1),
  results: z.array(exerciseResultSchema),
  totalDurationMs: z.number().int().nonnegative(),
  activeTimeSeconds: z.number().int().nonnegative(),
  startedAt: timestampSchema,
  finishedAt: timestampSchema.optional(),
  firstTryCorrect: z.number().int().nonnegative(),
  itemsAnswered: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  requiredScore: z.number().min(0).max(100),
  passed: z.boolean(),
  mastered: z.boolean(),
  completed: z.boolean(),
  accuracy: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  xpEarned: z.number().int().nonnegative(),
});

const baseEventSchema = z.object({
  id: z.string().min(1).max(200),
  deviceId: z.string().min(1).max(200),
  userId: z.string().min(1),
  timestamp: timestampSchema,
  synced: z.boolean().optional(),
  error: z.string().optional(),
  errorCount: z.number().int().nonnegative().optional(),
});

const syncEventSchema = z.discriminatedUnion("type", [
  baseEventSchema.extend({
    type: z.literal("lesson_attempt"),
    payload: z.object({ attempt: lessonAttemptSchema }),
  }),
  baseEventSchema.extend({
    type: z.literal("exercise_result"),
    payload: z.object({
      attemptId: z.string().uuid(),
      exerciseId: z.string().min(1),
      exerciseType: exerciseTypeSchema,
      itemId: z.string().min(1),
      status: exerciseStatusSchema,
      durationMs: z.number().int().nonnegative(),
      vocabularyId: z.string().optional(),
    }),
  }),
  baseEventSchema.extend({
    type: z.literal("vocabulary_review"),
    payload: z.object({
      wordId: z.string().min(1),
      rating: z.enum(["repeat", "hard", "good", "easy"]),
      reviewedAt: timestampSchema,
    }),
  }),
  baseEventSchema.extend({
    type: z.literal("settings_changed"),
    payload: z.object({
      settings: z.object({
        dailyGoal: z.enum(["light", "medium", "intense"]),
        ttsEnabled: z.boolean(),
        showLatin: z.boolean(),
        speechRate: z.number().min(0.5).max(2),
      }),
    }),
  }),
]);

export const syncBatchRequestSchema = z.object({
  events: z.array(syncEventSchema).min(1).max(100),
});

export function parseSyncBatch(input: unknown): SyncEvent[] {
  return syncBatchRequestSchema.parse(input).events as SyncEvent[];
}
