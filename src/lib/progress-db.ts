import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";
import {
  defaultProgress,
  normalizeProgress,
  rowToProgress,
} from "./progress-serialization";

const PROGRESS_KEY = "slogovo-progress-v1";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
  return defaultProgress(userId);
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
