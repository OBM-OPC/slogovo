import { z } from "zod";
import type { UserProgress } from "@/types";

const idSchema = z.string().trim().min(1).max(200);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const vocabularyProgressSchema = z.object({
  status: z.enum(["new", "learning", "review", "mastered", "difficult"]),
  nextReview: dateSchema.optional(),
  timesCorrect: z.number().int().nonnegative().max(1_000_000),
  timesWrong: z.number().int().nonnegative().max(1_000_000),
  lastReviewed: dateSchema.optional(),
  intervalIndex: z.number().int().min(-1).max(100),
  easeFactor: z.number().min(1).max(10).optional(),
  recognitionCorrect: z.number().int().nonnegative().max(1_000_000).optional(),
  recognitionTotal: z.number().int().nonnegative().max(1_000_000).optional(),
  productionCorrect: z.number().int().nonnegative().max(1_000_000).optional(),
  productionTotal: z.number().int().nonnegative().max(1_000_000).optional(),
  stability: z.number().nonnegative().max(100_000).optional(),
  difficulty: z.number().min(1).max(10).optional(),
  lapseCount: z.number().int().nonnegative().max(1_000_000).optional(),
  lastResponseMs: z.number().int().nonnegative().max(60 * 60 * 1000).optional(),
  lastErrorCategory: z.enum(["vocabulary", "cyrillic-confusion", "article-usage", "verb-conjugation", "gender-agreement", "word-order", "listening-confusion", "bulgarian-clitics"]).optional(),
  lastMistakeAt: z.string().datetime({ offset: true }).optional(),
  successfulReviewsSinceMistake: z.number().int().nonnegative().max(1_000_000).optional(),
  improvedAt: z.string().datetime({ offset: true }).optional(),
});

export const userProgressSchema = z.object({
  userId: idSchema,
  streak: z.object({
    current: z.number().int().nonnegative().max(100_000),
    longest: z.number().int().nonnegative().max(100_000),
    lastStudyDate: dateSchema.optional(),
    freezeUsedWeek: dateSchema.optional(),
    freezeAppliedOn: dateSchema.optional(),
  }),
  completedLessons: z.array(idSchema).max(10_000),
  masteredLessons: z.array(idSchema).max(10_000),
  completedModules: z.array(idSchema).max(1_000),
  vocabularyProgress: z.record(idSchema, vocabularyProgressSchema),
  lessonScores: z.record(idSchema, z.number().min(0).max(100)),
  exerciseStats: z.object({
    total: z.number().int().nonnegative().max(1_000_000_000),
    correct: z.number().int().nonnegative().max(1_000_000_000),
    wrong: z.number().int().nonnegative().max(1_000_000_000),
    consecutiveCorrect: z.number().int().nonnegative().max(1_000_000).optional(),
    listeningCorrect: z.number().int().nonnegative().max(1_000_000_000).optional(),
    listeningTotal: z.number().int().nonnegative().max(1_000_000_000).optional(),
  }),
  dailyStats: z.record(
    dateSchema,
    z.object({
      minutes: z.number().nonnegative().max(24 * 60),
      vocabulary: z.number().int().nonnegative().max(1_000_000),
      activeSeconds: z.number().int().nonnegative().max(24 * 60 * 60).optional(),
      lessons: z.number().int().nonnegative().max(1_000).optional(),
    })
  ),
  recordedAttemptIds: z.array(idSchema).max(100_000),
  settings: z.object({
    dailyGoal: z.enum(["light", "medium", "intense"]),
    weeklyLessonGoal: z.number().int().min(1).max(14).default(3),
    alphabetCompleted: z.boolean().default(false),
    streakFreezeUsedWeek: dateSchema.optional(),
    ttsEnabled: z.boolean(),
    showLatin: z.boolean(),
    speechRate: z.number().min(0.5).max(2),
    onboarding: z.object({
      completed: z.boolean(),
      knowsCyrillic: z.boolean(),
      priorBulgarian: z.enum(["none", "basic", "intermediate"]),
      knowsSlavicLanguage: z.boolean(),
      learningGoal: z.enum(["erasmus", "travel", "work", "family"]),
      recommendedPath: z.enum(["alphabet", "a1-foundation", "a1-review"]),
    }).default({ completed: false, knowsCyrillic: false, priorBulgarian: "none", knowsSlavicLanguage: false, learningGoal: "travel", recommendedPath: "alphabet" }),
  }),
  achievements: z.array(idSchema).max(1_000),
});

export function parseUserProgress(input: unknown): UserProgress {
  return userProgressSchema.parse(input) as UserProgress;
}
