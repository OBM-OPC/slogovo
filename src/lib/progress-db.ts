import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

const PROGRESS_KEY = "slogovo-progress-v1";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeProgress(progress: Partial<UserProgress> & { userId?: string }, userId: string): UserProgress {
  return {
    ...createDefaultProgress(userId),
    ...progress,
    userId,
    streak: { ...createDefaultProgress(userId).streak, ...(progress.streak ?? {}) },
    completedLessons: Array.isArray(progress.completedLessons) ? progress.completedLessons : [],
    masteredLessons: Array.isArray(progress.masteredLessons) ? progress.masteredLessons : [],
    completedModules: Array.isArray(progress.completedModules) ? progress.completedModules : [],
    vocabularyProgress: progress.vocabularyProgress ?? {},
    lessonScores: progress.lessonScores ?? {},
    exerciseStats: {
      ...createDefaultProgress(userId).exerciseStats,
      ...(progress.exerciseStats ?? {}),
    },
    dailyStats: progress.dailyStats ?? {},
    settings: { ...createDefaultProgress(userId).settings, ...(progress.settings ?? {}) },
    achievements: Array.isArray(progress.achievements) ? progress.achievements : [],
  };
}

function rowToProgress(row: Record<string, unknown> | null, fallbackUserId: string): UserProgress | null {
  if (!row) return null;
  const streak = row.streak as Partial<UserProgress["streak"]> | undefined;
  const userId = String(row.user_id ?? row.userId ?? fallbackUserId);
  return normalizeProgress(
    {
      userId,
      streak: {
        current: Number(row.streak_current ?? streak?.current ?? 0),
        longest: Number(row.streak_longest ?? streak?.longest ?? 0),
        lastStudyDate: (row.streak_last_study_date ?? streak?.lastStudyDate) as string | undefined,
      },
      completedLessons: row.completed_lessons as string[] | undefined,
      masteredLessons: row.mastered_lessons as string[] | undefined,
      completedModules: row.completed_modules as string[] | undefined,
      vocabularyProgress: row.vocabulary_progress as UserProgress["vocabularyProgress"] | undefined,
      lessonScores: row.lesson_scores as UserProgress["lessonScores"] | undefined,
      exerciseStats: row.exercise_stats as UserProgress["exerciseStats"] | undefined,
      dailyStats: row.daily_stats as UserProgress["dailyStats"] | undefined,
      settings: row.settings as UserProgress["settings"] | undefined,
      achievements: row.achievements as string[] | undefined,
    },
    userId
  );
}

export function saveProgressLocal(progress: UserProgress): void {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadProgressLocal(userId?: string): UserProgress | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return normalizeProgress(parsed, parsed.userId ?? userId ?? "local-user");
  } catch {
    return null;
  }
}

export function clearProgressLocal(): void {
  if (!canUseLocalStorage()) return;
  localStorage.removeItem(PROGRESS_KEY);
}

export async function loadProgressFromSupabase(userId: string): Promise<UserProgress | null> {
  try {
    const response = await fetch("/api/progress/load", { credentials: "include" });
    if (!response.ok) return null;
    const data = await response.json();
    return rowToProgress(data.progress, userId);
  } catch {
    return null;
  }
}

export async function saveProgressToSupabase(progress: UserProgress): Promise<boolean> {
  try {
    const response = await fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ progress }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function createInitialProgress(userId: string): Promise<UserProgress> {
  const progress = createDefaultProgress(userId);
  saveProgressLocal(progress);
  await saveProgressToSupabase(progress);
  return progress;
}

export function createDefaultProgress(userId: string): UserProgress {
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
    settings: {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: [],
  };
}

export function getVocabularyProgress(
  progress: UserProgress,
  wordId: string
): VocabularyProgress {
  return (
    progress.vocabularyProgress[wordId] || {
      status: "new",
      timesCorrect: 0,
      timesWrong: 0,
      intervalIndex: 0,
      easeFactor: 2.5,
    }
  );
}

export function getDailyGoalNumbers(goal: DailyGoal): { minutes: number; vocabulary: number } {
  switch (goal) {
    case "light":
      return { minutes: 5, vocabulary: 10 };
    case "medium":
      return { minutes: 15, vocabulary: 25 };
    case "intense":
      return { minutes: 30, vocabulary: 50 };
  }
}
