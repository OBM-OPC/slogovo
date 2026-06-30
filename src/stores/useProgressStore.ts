import { create } from "zustand";
import { UserProgress, Streak, DifficultyRating } from "@/types";
import {
  loadProgressFromSupabase,

  loadProgressLocal,
  saveProgressLocal,
  createInitialProgress,
} from "@/lib/progress-db";
import { todayISO } from "@/lib/utils";
import { reviewWord, reviewWordWithDifficulty } from "@/lib/spaced-repetition";
import { checkAchievements } from "@/lib/achievements";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti, triggerLevelUpConfetti } from "@/lib/confetti";

interface ProgressState {
  progress: UserProgress | null;
  initialized: boolean;
  syncing: boolean;
  userId: string | null;
  init: (userId: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  reviewVocabulary: (wordId: string, known: boolean) => Promise<void>;
  reviewVocabularyWithDifficulty: (wordId: string, rating: DifficultyRating) => Promise<void>;
  addExerciseResult: (correct: boolean) => Promise<void>;
  addStudyTime: (minutes: number, vocabulary?: number) => Promise<void>;
  updateSettings: (settings: Partial<UserProgress["settings"]>) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  syncNow: () => Promise<void>;
}

function updateStreak(progress: UserProgress): Streak {
  const today = todayISO();
  const last = progress.streak.lastStudyDate;

  if (!last || last === today) {
    return { ...progress.streak, lastStudyDate: today };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (last === yesterdayStr) {
    const current = progress.streak.current + 1;
    return {
      current,
      longest: Math.max(current, progress.streak.longest),
      lastStudyDate: today,
    };
  }

  return { current: 1, longest: progress.streak.longest, lastStudyDate: today };
}

function persist(updated: UserProgress): UserProgress {
  const newAchievements = checkAchievements(updated);
  if (newAchievements.length > 0) {
    return {
      ...updated,
      achievements: [...updated.achievements, ...newAchievements],
    };
  }
  return updated;
}

// Global sync timer — outside store to survive re-renders

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: null,
  initialized: false,
  syncing: false,
  userId: null,

  init: async (userId: string) => {
    if (get().initialized && get().userId === userId) {
      console.log("[Progress] Already initialized for", userId);
      return;
    }

    console.log("[Progress] Init for user:", userId);

    // Try Supabase first
    const fromSupabase = await loadProgressFromSupabase();

    // Also check localStorage
    const fromLocal = await loadProgressLocal();

    // Merge: prefer Supabase, but keep local if Supabase is empty
    let finalProgress: UserProgress | null = null;

    if (fromSupabase && fromLocal) {
      // Both exist — use whichever has more completed lessons
      if (fromSupabase.completedLessons.length >= fromLocal.completedLessons.length) {
        console.log("[Progress] Using Supabase data (more complete)");
        finalProgress = fromSupabase;
      } else {
        console.log("[Progress] Using local data (more complete), uploading to Supabase...");
        finalProgress = fromLocal;
        
      }
    } else if (fromSupabase) {
      console.log("[Progress] Loaded from Supabase");
      finalProgress = fromSupabase;
    } else if (fromLocal) {
      console.log("[Progress] Loaded from local cache, uploading to Supabase...");
      finalProgress = fromLocal;
      
    } else {
      console.log("[Progress] Creating fresh progress");
      finalProgress = await createInitialProgress(userId);
    }

    await saveProgressLocal(finalProgress);
    set({ progress: finalProgress, initialized: true, userId });
    console.log("[Progress] Init complete. completedLessons:", finalProgress.completedLessons.length);
  },

  syncNow: async () => {
    const state = get();
    if (!state.progress || !state.userId || state.syncing) return;

    console.log("[Progress] Manual sync...");
    set({ syncing: true });
    const ok = 
    set({ syncing: false });
    console.log("[Progress] Manual sync done:", ok);
  },

  completeLesson: async (lessonId: string) => {
    const state = get();
    console.log("[Progress] completeLesson called:", lessonId, { hasProgress: !!state.progress, alreadyCompleted: state.progress?.completedLessons.includes(lessonId) });
    if (!state.progress) return;
    if (state.progress.completedLessons.includes(lessonId)) return;

    const completedCountBefore = state.progress.completedLessons.length;
    const updated = persist({
      ...state.progress,
      completedLessons: [...state.progress.completedLessons, lessonId],
      streak: updateStreak(state.progress),
    });

    try {
      await saveProgressLocal(updated);
      console.log("[Progress] completeLesson saved locally");
      set({ progress: updated });
      // scheduleSync removed (localStorage-only);

      if (updated.completedLessons.length > completedCountBefore) {
        triggerLevelUpConfetti();
      }
    } catch (error) {
      console.error("[Progress] completeLesson error:", error);
    }
  },

  completeModule: async (moduleId: string) => {
    const state = get();
    if (!state.progress) return;
    if (state.progress.completedModules.includes(moduleId)) return;

    const updated = persist({
      ...state.progress,
      completedModules: [...state.progress.completedModules, moduleId],
      streak: updateStreak(state.progress),
    });

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  reviewVocabulary: async (wordId: string, known: boolean) => {
    const state = get();
    if (!state.progress) return;

    const existing = state.progress.vocabularyProgress[wordId] || {
      status: "new",
      timesCorrect: 0,
      timesWrong: 0,
      intervalIndex: 0,
      easeFactor: 2.5,
    };

    const updated = {
      ...state.progress,
      vocabularyProgress: {
        ...state.progress.vocabularyProgress,
        [wordId]: reviewWord(existing, known),
      },
    };

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  reviewVocabularyWithDifficulty: async (wordId: string, rating: DifficultyRating) => {
    const state = get();
    if (!state.progress) return;

    const existing = state.progress.vocabularyProgress[wordId] || {
      status: "new",
      timesCorrect: 0,
      timesWrong: 0,
      intervalIndex: 0,
      easeFactor: 2.5,
    };

    const updated = {
      ...state.progress,
      vocabularyProgress: {
        ...state.progress.vocabularyProgress,
        [wordId]: reviewWordWithDifficulty(existing, rating),
      },
    };

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  addExerciseResult: async (correct: boolean) => {
    const state = get();
    if (!state.progress) return;

    const stats = state.progress.exerciseStats;
    const currentConsecutive = correct
      ? (state.progress.exerciseStats.consecutiveCorrect ?? 0) + 1
      : 0;

    if (correct) {
      vibrateCorrect(currentConsecutive);
      if (currentConsecutive > 0 && currentConsecutive % 3 === 0) {
        triggerConfetti({ scalar: 1 + Math.min(currentConsecutive, 10) * 0.05 });
      }
    } else {
      vibrateWrong();
    }

    const updated = persist({
      ...state.progress,
      exerciseStats: {
        total: stats.total + 1,
        correct: stats.correct + (correct ? 1 : 0),
        wrong: stats.wrong + (correct ? 0 : 1),
        consecutiveCorrect: currentConsecutive,
      },
    });

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  addStudyTime: async (minutes: number, vocabulary = 0) => {
    const state = get();
    if (!state.progress) return;

    const today = todayISO();
    const todayStats = state.progress.dailyStats[today] || { minutes: 0, vocabulary: 0 };
    const currentStreak = state.progress.streak.current;

    const updated = persist({
      ...state.progress,
      dailyStats: {
        ...state.progress.dailyStats,
        [today]: {
          minutes: todayStats.minutes + minutes,
          vocabulary: todayStats.vocabulary + vocabulary,
        },
      },
      streak: updateStreak(state.progress),
    });

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);

    if (updated.streak.current > currentStreak && updated.streak.current > 0 && updated.streak.current % 7 === 0) {
      triggerConfetti({ scalar: 1 + updated.streak.current * 0.02 });
    }
  },

  updateSettings: async (settings) => {
    const state = get();
    if (!state.progress) return;

    const updated = {
      ...state.progress,
      settings: { ...state.progress.settings, ...settings },
    };

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  unlockAchievement: async (achievementId: string) => {
    const state = get();
    if (!state.progress) return;
    if (state.progress.achievements.includes(achievementId)) return;

    const updated = {
      ...state.progress,
      achievements: [...state.progress.achievements, achievementId],
    };

    await saveProgressLocal(updated);
    set({ progress: updated });
    // scheduleSync removed (localStorage-only);
  },

  resetProgress: async () => {
    const state = get();
    if (!state.userId) return;

    const fresh = {
      ...createDefaultProgress(state.userId),
      userId: state.userId,
    };

    await saveProgressLocal(fresh);
    
    set({ progress: fresh });
  },
}));

// Schedule a sync with latest state captured

function createDefaultProgress(userId: string) {
  return {
    userId,
    streak: { current: 0, longest: 0 },
    completedLessons: [],
    completedModules: [],
    vocabularyProgress: {},
    exerciseStats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    dailyStats: {},
    settings: {
      dailyGoal: "medium" as const,
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: [],
  };
}
