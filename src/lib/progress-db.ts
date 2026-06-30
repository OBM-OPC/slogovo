import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

const PROGRESS_KEY = "slogovo-progress-v1";

// ==== localStorage only (reliable, simple) ====

export function saveProgressLocal(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    console.log("[Progress] Saved to localStorage, completedLessons:", progress.completedLessons.length);
  } catch (error) {
    console.warn("[Progress] localStorage save failed:", error);
  }
}

export function loadProgressLocal(): UserProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      console.log("[Progress] localStorage empty");
      return null;
    }
    const parsed = JSON.parse(raw) as UserProgress;
    console.log("[Progress] Loaded from localStorage, completedLessons:", parsed.completedLessons.length);
    return parsed;
  } catch (error) {
    console.warn("[Progress] localStorage load failed:", error);
    return null;
  }
}

export function clearProgressLocal(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    console.log("[Progress] localStorage cleared");
  } catch {
    // ignore
  }
}

// ==== No-op Supabase functions (for backward compat) ====

export async function loadProgressFromSupabase(): Promise<UserProgress | null> {
  console.log("[Progress] Supabase load skipped (using localStorage)");
  return null;
}

export async function saveProgressToSupabase(): Promise<boolean> {
  console.log("[Progress] Supabase save skipped (using localStorage)");
  return true;
}

export async function createInitialProgress(userId: string): Promise<UserProgress> {
  const progress = createDefaultProgress(userId);
  saveProgressLocal(progress);
  return progress;
}

// ==== Helpers ====

function createDefaultProgress(userId: string): UserProgress {
  return {
    userId,
    streak: { current: 0, longest: 0 },
    completedLessons: [],
    completedModules: [],
    vocabularyProgress: {},
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
