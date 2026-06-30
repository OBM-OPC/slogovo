import { create } from "zustand";
import { UserProgress, Streak, DifficultyRating } from "@/types";
import {
  loadProgressLocal,
  saveProgressLocal,
  loadProgressFromSupabase,
  saveProgressToSupabase,
  createInitialProgress,
  createDefaultProgress,
} from "@/lib/progress-db";
import { todayISO } from "@/lib/utils";
import { reviewWord, reviewWordWithDifficulty } from "@/lib/spaced-repetition";
import { checkAchievements } from "@/lib/achievements";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti, triggerLevelUpConfetti } from "@/lib/confetti";
import { getLessonsByModule } from "@/lib/content";

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

  if (!last) {
    return {
      current: 1,
      longest: Math.max(1, progress.streak.longest),
      lastStudyDate: today,
    };
  }

  if (last === today) {
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

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: null,
  initialized: false,
  syncing: false,
  userId: null,

  init: async (userId: string) => {
    if (get().initialized && get().userId === userId) return;

    const storedLocal = loadProgressLocal(userId);
    const fromLocal = storedLocal?.userId === userId ? storedLocal : null;
    const fromRemote = await loadProgressFromSupabase(userId);

    let finalProgress: UserProgress;
    if (fromLocal && fromRemote) {
      // Prefer whichever copy has more completed lessons. This prevents an empty
      // or stale Supabase row from wiping real local progress on page load.
      finalProgress = fromLocal.completedLessons.length >= fromRemote.completedLessons.length
        ? fromLocal
        : fromRemote;
    } else {
      finalProgress = fromLocal ?? fromRemote ?? (await createInitialProgress(userId));
    }

    saveProgressLocal(finalProgress);
    set({ progress: finalProgress, initialized: true, userId });

    // Best-effort remote sync after state is initialized.
    void saveProgressToSupabase(finalProgress);
  },

  syncNow: async () => {
    const state = get();
    if (!state.progress || !state.userId || state.syncing) return;

    set({ syncing: true });
    saveProgressLocal(state.progress);
    await saveProgressToSupabase(state.progress);
    set({ syncing: false });
  },

  completeLesson: async (lessonId: string) => {
    const state = get();
    if (!state.progress) return;
    if (state.progress.completedLessons.includes(lessonId)) return;

    const completedCountBefore = state.progress.completedLessons.length;
    const completedLessons = [...state.progress.completedLessons, lessonId];
    const lessonModuleId = lessonId.split("-lektion-")[0];
    const moduleLessons = getLessonsByModule(lessonModuleId);
    const moduleIsComplete =
      moduleLessons.length > 0 && moduleLessons.every((lesson) => completedLessons.includes(lesson.lessonId));
    const completedModules =
      moduleIsComplete && !state.progress.completedModules.includes(lessonModuleId)
        ? [...state.progress.completedModules, lessonModuleId]
        : state.progress.completedModules;

    const updated = persist({
      ...state.progress,
      completedLessons,
      completedModules,
      streak: updateStreak(state.progress),
    });

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);

    if (updated.completedLessons.length > completedCountBefore) {
      triggerLevelUpConfetti();
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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);

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

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
  },

  unlockAchievement: async (achievementId: string) => {
    const state = get();
    if (!state.progress) return;
    if (state.progress.achievements.includes(achievementId)) return;

    const updated = {
      ...state.progress,
      achievements: [...state.progress.achievements, achievementId],
    };

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);
  },

  resetProgress: async () => {
    const state = get();
    if (!state.userId) return;

    const fresh = {
      ...createDefaultProgress(state.userId),
      userId: state.userId,
    };

    saveProgressLocal(fresh);
    set({ progress: fresh });
    await saveProgressToSupabase(fresh);
  },
}));
