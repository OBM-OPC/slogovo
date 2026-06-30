import { openDB, DBSchema, IDBPDatabase } from "idb";
import { supabase } from "./supabase";
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

// ==== Supabase (source of truth) ====

export async function loadProgressFromSupabase(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.warn("Supabase load error:", error);
    }
    return null;
  }

  return rowToProgress(data);
}

export async function saveProgressToSupabase(progress: UserProgress): Promise<boolean> {
  const { userId, ...rest } = progressToRow(progress);

  const { error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        ...rest,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.warn("Supabase save error:", error);
    return false;
  }

  return true;
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

interface ProgressRow {
  user_id: string;
  streak_current: number;
  streak_longest: number;
  streak_last_study_date: string | null;
  completed_lessons: string[];
  completed_modules: string[];
  vocabulary_progress: Record<string, VocabularyProgress>;
  exercise_stats: { total: number; correct: number; wrong: number; consecutiveCorrect?: number };
  daily_stats: Record<string, { minutes: number; vocabulary: number }>;
  settings: { dailyGoal: DailyGoal; ttsEnabled: boolean; showLatin: boolean; speechRate: number };
  achievements: string[];
}

function rowToProgress(row: ProgressRow): UserProgress {
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

function progressToRow(progress: UserProgress) {
  return {
    userId: progress.userId,
    streak_current: progress.streak.current,
    streak_longest: progress.streak.longest,
    streak_last_study_date: progress.streak.lastStudyDate ?? null,
    completed_lessons: progress.completedLessons,
    completed_modules: progress.completedModules,
    vocabulary_progress: progress.vocabularyProgress,
    exercise_stats: progress.exerciseStats,
    daily_stats: progress.dailyStats,
    settings: progress.settings,
    achievements: progress.achievements,
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
