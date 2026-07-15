import type { UserProgress } from "@/types";

export function defaultProgress(userId: string): UserProgress {
  return {
    userId,
    streak: { current: 0, longest: 0 },
    completedLessons: [],
    masteredLessons: [],
    completedModules: [],
    vocabularyProgress: {},
    lessonScores: {},
    exerciseStats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    dailyStats: {},
    recordedAttemptIds: [],
    settings: {
      dailyGoal: "medium",
      weeklyLessonGoal: 3,
      alphabetCompleted: false,
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
      onboarding: {
        completed: false,
        knowsCyrillic: false,
        priorBulgarian: "none",
        knowsSlavicLanguage: false,
        learningGoal: "travel",
        recommendedPath: "alphabet",
      },
    },
    achievements: [],
  };
}

export function normalizeProgress(
  progress: Partial<UserProgress> & { userId?: string },
  userId: string
): UserProgress {
  const defaults = defaultProgress(userId);
  return {
    ...defaults,
    ...progress,
    userId,
    streak: { ...defaults.streak, ...(progress.streak ?? {}) },
    completedLessons: Array.isArray(progress.completedLessons) ? progress.completedLessons : [],
    masteredLessons: Array.isArray(progress.masteredLessons) ? progress.masteredLessons : [],
    completedModules: Array.isArray(progress.completedModules) ? progress.completedModules : [],
    vocabularyProgress: progress.vocabularyProgress ?? {},
    exerciseStats: { ...defaults.exerciseStats, ...(progress.exerciseStats ?? {}) },
    dailyStats: progress.dailyStats ?? {},
    lessonScores: progress.lessonScores ?? {},
    recordedAttemptIds: Array.isArray(progress.recordedAttemptIds) ? progress.recordedAttemptIds : [],
    settings: {
      ...defaults.settings,
      ...(progress.settings ?? {}),
      onboarding: {
        ...defaults.settings.onboarding,
        ...(progress.settings?.onboarding ?? {}),
      },
    },
    achievements: Array.isArray(progress.achievements) ? progress.achievements : [],
  };
}

export function rowToProgress(
  row: Record<string, unknown> | null,
  fallbackUserId: string
): UserProgress | null {
  if (!row) return null;
  const streak = row.streak as Partial<UserProgress["streak"]> | undefined;
  const rowSettings = row.settings as UserProgress["settings"] | undefined;
  const userId = String(row.user_id ?? row.userId ?? fallbackUserId);
  return normalizeProgress(
    {
      userId,
      streak: {
        current: Number(row.streak_current ?? streak?.current ?? 0),
        longest: Number(row.streak_longest ?? streak?.longest ?? 0),
        lastStudyDate: (row.streak_last_study_date ?? streak?.lastStudyDate) as string | undefined,
        freezeUsedWeek: streak?.freezeUsedWeek ?? rowSettings?.streakFreezeUsedWeek,
      },
      completedLessons: (row.completed_lessons ?? row.completedLessons) as string[] | undefined,
      masteredLessons: (row.mastered_lessons ?? row.masteredLessons) as string[] | undefined,
      completedModules: (row.completed_modules ?? row.completedModules) as string[] | undefined,
      vocabularyProgress: (row.vocabulary_progress ?? row.vocabularyProgress) as
        | UserProgress["vocabularyProgress"]
        | undefined,
      exerciseStats: (row.exercise_stats ?? row.exerciseStats) as
        | UserProgress["exerciseStats"]
        | undefined,
      dailyStats: (row.daily_stats ?? row.dailyStats) as UserProgress["dailyStats"] | undefined,
      lessonScores: (row.lesson_scores ?? row.lessonScores) as
        | UserProgress["lessonScores"]
        | undefined,
      recordedAttemptIds: (row.recorded_attempt_ids ?? row.recordedAttemptIds) as
        | string[]
        | undefined,
      settings: rowSettings,
      achievements: row.achievements as string[] | undefined,
    },
    userId
  );
}

export function progressToRow(progress: UserProgress): Record<string, unknown> {
  return {
    user_id: progress.userId,
    streak_current: progress.streak.current,
    streak_longest: progress.streak.longest,
    streak_last_study_date: progress.streak.lastStudyDate ?? null,
    completed_lessons: progress.completedLessons,
    mastered_lessons: progress.masteredLessons,
    completed_modules: progress.completedModules,
    vocabulary_progress: progress.vocabularyProgress,
    lesson_scores: progress.lessonScores,
    exercise_stats: progress.exerciseStats,
    daily_stats: progress.dailyStats,
    recorded_attempt_ids: progress.recordedAttemptIds,
    settings: { ...progress.settings, streakFreezeUsedWeek: progress.streak.freezeUsedWeek ?? progress.settings.streakFreezeUsedWeek },
    achievements: progress.achievements,
  };
}
