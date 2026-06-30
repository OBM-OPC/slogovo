import { openDB, DBSchema, IDBPDatabase } from "idb";
import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

const PROGRESS_KEY = "slogovo-progress-v1";

// ==== localStorage (primary, robust fallback) ====

export function saveProgressLocalStorage(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("[Progress] localStorage save failed:", error);
  }
}

export function loadProgressLocalStorage(): UserProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProgress;
  } catch (error) {
    console.warn("[Progress] localStorage load failed:", error);
    return null;
  }
}

// ==== IndexedDB (secondary / legacy) ====

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

export async function saveProgressIndexedDB(progress: UserProgress): Promise<void> {
  const db = await getProgressDB();
  await db.put("progress", progress);
}

export async function loadProgressIndexedDB(userId: string): Promise<UserProgress | undefined> {
  const db = await getProgressDB();
  return db.get("progress", userId);
}

export async function clearProgressLocal(userId: string): Promise<void> {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
  try {
    const db = await getProgressDB();
    await db.delete("progress", userId);
  } catch {
    // ignore
  }
}

// ==== Unified local save/load ====

export async function saveProgressLocal(progress: UserProgress): Promise<void> {
  saveProgressLocalStorage(progress);
  try {
    await saveProgressIndexedDB(progress);
  } catch (error) {
    console.warn("[Progress] IndexedDB save failed:", error);
  }
}

export async function loadProgressLocal(userId: string): Promise<UserProgress | undefined> {
  // Prefer localStorage (more reliable)
  const fromStorage = loadProgressLocalStorage();
  if (fromStorage && fromStorage.userId === userId) {
    return fromStorage;
  }
  // Fallback to IndexedDB (legacy)
  return loadProgressIndexedDB(userId);
}

// ==== Server-side API (source of truth) ====

export async function loadProgressFromSupabase(): Promise<UserProgress | null> {
  try {
    console.log("[Progress] Calling /api/progress/load");
    const response = await fetch("/api/progress/load");
    console.log("[Progress] /api/progress/load status:", response.status);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      console.warn("[Progress] Load failed:", response.status, err);
      return null;
    }

    const { progress } = await response.json();
    console.log("[Progress] Loaded raw data:", progress);
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
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      console.warn("[Progress] Save failed:", response.status, err);
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
