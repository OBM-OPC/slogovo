import { createClient } from "@supabase/supabase-js";
import { UserProgress, VocabularyProgress, DailyGoal } from "@/types";

const PROGRESS_KEY = "slogovo-progress-v1";

// ==== Browser-side Supabase client ====

let supabaseBrowser: ReturnType<typeof createClient> | null = null;

function getSupabaseBrowser() {
  if (typeof window === "undefined") return null;
  if (!supabaseBrowser) {
    supabaseBrowser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return supabaseBrowser;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (!match) return null;
  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

async function restoreSession() {
  const raw = getCookie("sb-token");
  if (!raw) return false;
  try {
    const tokens = JSON.parse(raw);
    const sb = getSupabaseBrowser();
    if (sb && tokens.access_token) {
      await sb.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

// ==== localStorage ====

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

// ==== Unified local save/load ====

export async function saveProgressLocal(progress: UserProgress): Promise<void> {
  saveProgressLocalStorage(progress);
}

export async function loadProgressLocal(): Promise<UserProgress | undefined> {
  const fromStorage = loadProgressLocalStorage();
  return fromStorage ?? undefined;
}

export async function clearProgressLocal(): Promise<void> {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}

// ==== Supabase direct (browser-side) ====

export async function loadProgressFromSupabase(): Promise<UserProgress | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;

  const authed = await restoreSession();
  if (!authed) {
    console.warn("[Progress] No session token found");
    return null;
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    console.warn("[Progress] Not authenticated");
    return null;
  }

  const { data, error } = await sb
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      console.warn("[Progress] Supabase load error:", error);
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log("[Progress] Loaded from Supabase:", (data as any).completed_lessons);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rowToProgress(data as any);
}

export async function saveProgressToSupabase(progress: UserProgress): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;

  const authed = await restoreSession();
  if (!authed) {
    console.warn("[Progress] No session token for save");
    return false;
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    console.warn("[Progress] Not authenticated for save");
    return false;
  }

  const row = progressToRow(progress);

  console.log("[Progress] Saving to Supabase:", row.completed_lessons);

  const { error } = await sb
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("user_progress" as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(
      {
        user_id: user.id,
        ...row,
        updated_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { onConflict: "user_id" }
    );

  if (error) {
    console.warn("[Progress] Supabase save error:", error);
    return false;
  }

  console.log("[Progress] Saved to Supabase successfully");
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

function progressToRow(progress: UserProgress) {
  return {
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
