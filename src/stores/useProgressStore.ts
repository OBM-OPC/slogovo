import { create } from "zustand";
import { UserProgress, Streak, DifficultyRating } from "@/types";
import { loadProgress, saveProgress, createDefaultProgress } from "@/lib/db";
import { todayISO } from "@/lib/utils";
import { reviewWord, reviewWordWithDifficulty } from "@/lib/spaced-repetition";
import { checkAchievements } from "@/lib/achievements";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti, triggerLevelUpConfetti } from "@/lib/confetti";

interface ProgressState {
  progress: UserProgress;
  initialized: boolean;
  init: () => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  reviewVocabulary: (wordId: string, known: boolean) => Promise<void>;
  reviewVocabularyWithDifficulty: (wordId: string, rating: DifficultyRating) => Promise<void>;
  addExerciseResult: (correct: boolean) => Promise<void>;
  addStudyTime: (minutes: number, vocabulary?: number) => Promise<void>;
  updateSettings: (settings: Partial<UserProgress["settings"]>) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
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

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: createDefaultProgress(),
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const loaded = await loadProgress();
    set({ progress: loaded, initialized: true });
  },

  completeLesson: async (lessonId: string) => {
    const state = get();
    if (state.progress.completedLessons.includes(lessonId)) return;
    const completedCountBefore = state.progress.completedLessons.length;
    const updated = persist({
      ...state.progress,
      completedLessons: [...state.progress.completedLessons, lessonId],
      streak: updateStreak(state.progress),
    });
    await saveProgress(updated);
    set({ progress: updated });
    if (updated.completedLessons.length > completedCountBefore) {
      triggerLevelUpConfetti();
    }
  },

  completeModule: async (moduleId: string) => {
    const state = get();
    if (state.progress.completedModules.includes(moduleId)) return;
    const updated = persist({
      ...state.progress,
      completedModules: [...state.progress.completedModules, moduleId],
      streak: updateStreak(state.progress),
    });
    await saveProgress(updated);
    set({ progress: updated });
  },

  reviewVocabulary: async (wordId: string, known: boolean) => {
    const state = get();
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
    await saveProgress(updated);
    set({ progress: updated });
  },

  reviewVocabularyWithDifficulty: async (wordId: string, rating: DifficultyRating) => {
    const state = get();
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
    await saveProgress(updated);
    set({ progress: updated });
  },

  addExerciseResult: async (correct: boolean) => {
    const state = get();
    const stats = state.progress.exerciseStats;
    const currentConsecutive = correct ? (state.progress.exerciseStats.consecutiveCorrect ?? 0) + 1 : 0;

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
    await saveProgress(updated);
    set({ progress: updated });
  },

  addStudyTime: async (minutes: number, vocabulary = 0) => {
    const state = get();
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
    await saveProgress(updated);
    set({ progress: updated });
    if (updated.streak.current > currentStreak && updated.streak.current > 0 && updated.streak.current % 7 === 0) {
      triggerConfetti({ scalar: 1 + updated.streak.current * 0.02 });
    }
  },

  updateSettings: async (settings) => {
    const state = get();
    const updated = {
      ...state.progress,
      settings: { ...state.progress.settings, ...settings },
    };
    await saveProgress(updated);
    set({ progress: updated });
  },

  unlockAchievement: async (achievementId: string) => {
    const state = get();
    if (state.progress.achievements.includes(achievementId)) return;
    const updated = {
      ...state.progress,
      achievements: [...state.progress.achievements, achievementId],
    };
    await saveProgress(updated);
    set({ progress: updated });
  },

  resetProgress: async () => {
    const fresh = createDefaultProgress();
    await saveProgress(fresh);
    set({ progress: fresh });
  },
}));
