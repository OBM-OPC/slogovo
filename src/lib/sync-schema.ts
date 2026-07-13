import { z } from "zod";
import type { SyncEvent } from "./sync-queue";

const timestampSchema = z.string().datetime({ offset: true });
const exerciseStatusSchema = z.enum(["correct", "typo", "wrong-form", "wrong", "skipped"]);
const feedbackStatusSchema = z.enum([
  "correct",
  "correct_with_typo",
  "accepted_variant",
  "partially_correct",
  "wrong_form",
  "wrong_word",
  "missing_word",
  "incorrect",
]);
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
  userAnswer: z.string().max(10_000).optional(),
  acceptedAnswers: z.array(z.string().max(10_000)).max(100),
  feedback: z.string().max(20_000).optional(),
  feedbackStatus: feedbackStatusSchema.optional(),
  feedbackNeedsReview: z.boolean().optional(),
  durationMs: z.number().int().nonnegative().max(60 * 60 * 1000),
  startedAt: timestampSchema,
  completedAt: timestampSchema,
  attemptNumber: z.number().int().positive().max(3),
  hintsUsed: z.number().int().nonnegative().max(100),
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
  itemResults: z.array(itemResultSchema).max(1_000),
  hintsUsed: z.number().int().nonnegative().max(100_000),
  startedAt: timestampSchema,
  completedAt: timestampSchema,
});

const lessonAttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  moduleId: z.string().min(1),
  level: z.string().min(1),
  results: z.array(exerciseResultSchema).max(500),
  totalDurationMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1000),
  activeTimeSeconds: z.number().int().nonnegative().max(24 * 60 * 60),
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
