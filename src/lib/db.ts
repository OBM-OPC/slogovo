import { openDB, DBSchema, IDBPDatabase } from "idb";
import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

interface BulgarianDB extends DBSchema {
  progress: {
    key: string;
    value: UserProgress;
  };
}

const DB_NAME = "bulgarisch-lernen-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BulgarianDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BulgarianDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BulgarianDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "userId" });
        }
      },
    });
  }
  return dbPromise;
}

export function createDefaultProgress(): UserProgress {
  return {
    userId: "local-user",
    streak: { current: 0, longest: 0 },
    completedLessons: [],
    completedModules: [],
    vocabularyProgress: {},
    exerciseStats: { total: 0, correct: 0, wrong: 0 },
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

export async function loadProgress(): Promise<UserProgress> {
  const db = await getDB();
  const stored = await db.get("progress", "local-user");
  return stored || createDefaultProgress();
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  const db = await getDB();
  await db.put("progress", progress);
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
