import { openDB, DBSchema, IDBPDatabase } from "idb";
import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

// ==== IndexedDB (local cache) ====

interface ProgressDB extends DBSchema {
  progress: {
    key: string; // userId
    value: UserProgress;
  };
}

const DB_NAME = "slogovo-progress";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ProgressDB>> | null = null;

export function getProgressDB(): Promise<IDBPDatabase<ProgressDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ProgressDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "userId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProgressLocal(progress: UserProgress): Promise<void> {
  const db = await getProgressDB();
  await db.put("progress", progress);
}

export async function loadProgressLocal(userId: string): Promise<UserProgress | undefined> {
  const db = await getProgressDB();
  return db.get("progress", userId);
}

export async function clearProgressLocal(userId: string): Promise<void> {
  const db = await getProgressDB();
  await db.delete("progress", userId);
}

// ==== Server-side API (source of truth) ====
// Server reads httpOnly cookie, so we never expose tokens to browser JS.

export async function loadProgressFromSupabase(): Promise<UserProgress | null> {
  try {
    console.log("[Progress] Calling /api/progress/load");
    const response = await fetch("/api/progress/load");
    console.log("[Progress] /api/progress/load status:", response.status);
    if (!response.ok) {
      if (response.status === 401) {
        console.warn("[Progress] Load: not authenticated");
      } else {
        console.warn("[Progress] Load failed:", response.status);
      }
      return null;
    }

    const { progress } = await response.json();
    console.log("[Progress] Loaded:", progress ? "data found" : "no data");
    if (!progress) return null;

    return rowToProgress(progress);
  } catch (error) {
    console.warn("[Progress] Load error:", error);
    return null;
  }
}

export async function saveProgressToSupabase(progress: UserProgress): Promise<boolean> {
  try {
    console.log("[Progress] Calling /api/progress/save");
    const response = await fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });

    console.log("[Progress] /api/progress/save status:", response.status);
    if (!response.ok) {
      console.warn("[Progress] Save failed:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Progress] Save error:", error);
    return false;
  }
}

export async function createInitialProgress(userId: string): Promise<UserProgress> {
  const progress = createDefaultProgress(userId);
  await saveProgressToSupabase(progress);
  await saveProgressLocal(progress);
  return progress;
}

// ==== Conversion helpers ====

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProgress(row: any): UserProgress {
  return {
    userId: row.user_id,
    streak: {
      current: row.streak_current ?? 0,
      longest: row.streak_longest ?? 0,
      lastStudyDate: row.streak_last_study_date ?? undefined,
    },
    completedLessons: row.completed_lessons ?? [],
    completedModules: row.completed_modules ?? [],
    vocabularyProgress: row.vocabulary_progress ?? {},
    exerciseStats: row.exercise_stats ?? { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    dailyStats: row.daily_stats ?? {},
    settings: row.settings ?? {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: row.achievements ?? [],
  };
}

// ==== Helper exports (backward compat) ====

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
