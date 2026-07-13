"use client";

import { create } from "zustand";
import { UserProgress, DifficultyRating, LessonAttempt } from "@/types";
import {
  loadProgressLocal,
  saveProgressLocal,
  loadProgressFromSupabase,
  saveProgressToSupabase,
  createInitialProgress,
  createDefaultProgress,
} from "@/lib/progress-db";
import { todayISO } from "@/lib/utils";
import { updateStreakForDate } from "@/lib/streak";
import { reviewWord, reviewWordWithDifficulty } from "@/lib/spaced-repetition";
import { checkAchievements } from "@/lib/achievements";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti, triggerLevelUpConfetti } from "@/lib/confetti";
import { getLessonsByModule } from "@/lib/content";
import { enableAutoSync, processSyncQueue, scheduleSync } from "@/lib/sync";
import { addEvent, addLessonAttemptEvent } from "@/lib/sync-queue";
import { mergeProgress } from "@/lib/progress-merge";
import { recordProductionAttempt, recordRecognitionAttempt } from "@/lib/mastery-tracking";

interface ProgressState {
  progress: UserProgress | null;
  initialized: boolean;
  syncing: boolean;
  userId: string | null;
  init: (userId: string) => Promise<void>;
  recordLessonAttempt: (attempt: LessonAttempt, vocabulary?: number) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  reviewVocabulary: (wordId: string, known: boolean) => Promise<void>;
  reviewVocabularyWithDifficulty: (
    wordId: string,
    rating: DifficultyRating,
    mode?: "recognition" | "production"
  ) => Promise<void>;
  addStudyTime: (minutes: number, vocabulary?: number) => Promise<void>;
  updateSettings: (settings: Partial<UserProgress["settings"]>) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  syncNow: () => Promise<import("@/lib/sync").SyncResult | undefined>;
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

function queueLessonAttempt(userId: string, attempt: LessonAttempt): void {
  addLessonAttemptEvent({ ...attempt, userId });
  scheduleSync(userId);
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
      // Merge local and remote progress so no device drops valid data.
      finalProgress = mergeProgress(fromLocal, fromRemote);
    } else {
      finalProgress = fromLocal ?? fromRemote ?? (await createInitialProgress(userId));
    }

    saveProgressLocal(finalProgress);
    set({ progress: finalProgress, initialized: true, userId });
    enableAutoSync(userId, async () => {
      const latest = get().progress;
      if (latest) await saveProgressToSupabase(latest);
    });

    // Best-effort remote sync after state is initialized.
    void saveProgressToSupabase(finalProgress);
    void processSyncQueue(userId);
  },

  syncNow: async () => {
    const state = get();
    if (!state.progress || !state.userId || state.syncing) return;

    set({ syncing: true });
    saveProgressLocal(state.progress);
    const syncResult = await processSyncQueue(state.userId);
    await saveProgressToSupabase(state.progress);
    set({ syncing: false });
    return syncResult;
  },

  recordLessonAttempt: async (attempt: LessonAttempt, vocabulary = 0) => {
    const state = get();
    if (!state.progress) return;
    if (state.progress.recordedAttemptIds.includes(attempt.id)) return;

    const completedLessons = attempt.passed && !state.progress.completedLessons.includes(attempt.lessonId)
      ? [...state.progress.completedLessons, attempt.lessonId]
      : state.progress.completedLessons;
    const masteredLessons = attempt.mastered && !state.progress.masteredLessons.includes(attempt.lessonId)
      ? [...state.progress.masteredLessons, attempt.lessonId]
      : state.progress.masteredLessons;
    const moduleLessons = getLessonsByModule(attempt.moduleId);
    const moduleIsComplete =
      moduleLessons.length > 0 && moduleLessons.every((lesson) => completedLessons.includes(lesson.lessonId));
    const completedModules =
      moduleIsComplete && !state.progress.completedModules.includes(attempt.moduleId)
        ? [...state.progress.completedModules, attempt.moduleId]
        : state.progress.completedModules;
    const activityDate = todayISO(attempt.finishedAt ? new Date(attempt.finishedAt) : new Date());
    const day = state.progress.dailyStats[activityDate] ?? { minutes: 0, vocabulary: 0, activeSeconds: 0 };
    const previousBest = state.progress.lessonScores[attempt.lessonId] ?? 0;
    const currentConsecutive = attempt.incorrectCount > 0
      ? 0
      : (state.progress.exerciseStats.consecutiveCorrect ?? 0) + attempt.correctCount;

    const updated = persist({
      ...state.progress,
      completedLessons,
      masteredLessons,
      completedModules,
      lessonScores: {
        ...state.progress.lessonScores,
        [attempt.lessonId]: Math.max(previousBest, attempt.score),
      },
      exerciseStats: {
        total: state.progress.exerciseStats.total + attempt.correctCount + attempt.incorrectCount,
        correct: state.progress.exerciseStats.correct + attempt.correctCount,
        wrong: state.progress.exerciseStats.wrong + attempt.incorrectCount,
        consecutiveCorrect: currentConsecutive,
      },
      dailyStats: {
        ...state.progress.dailyStats,
        [activityDate]: {
          minutes: day.minutes + attempt.activeTimeSeconds / 60,
          activeSeconds: (day.activeSeconds ?? Math.round(day.minutes * 60)) + attempt.activeTimeSeconds,
          vocabulary: day.vocabulary + (attempt.passed ? vocabulary : 0),
        },
      },
      recordedAttemptIds: [...state.progress.recordedAttemptIds, attempt.id],
      streak: attempt.activeTimeSeconds > 0
        ? updateStreakForDate(state.progress.streak, attempt.finishedAt ? new Date(attempt.finishedAt) : new Date())
        : state.progress.streak,
    });

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);

    if (state.userId) {
      queueLessonAttempt(state.userId, attempt);
    }

    if (attempt.correctCount > 0 && attempt.incorrectCount === 0) vibrateCorrect(currentConsecutive);
    if (attempt.incorrectCount > 0) vibrateWrong();
    if (attempt.mastered) {
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
      streak: updateStreakForDate(state.progress.streak),
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

    if (state.userId) {
      addEvent({
        type: "vocabulary_review",
        userId: state.userId,
        timestamp: new Date().toISOString(),
        payload: {
          wordId,
          rating: known ? "good" : "repeat",
          reviewedAt: new Date().toISOString(),
        },
      });
      scheduleSync(state.userId);
    }
  },

  reviewVocabularyWithDifficulty: async (wordId, rating, mode = "recognition") => {
    const state = get();
    if (!state.progress) return;

    const existing = state.progress.vocabularyProgress[wordId] || {
      status: "new",
      timesCorrect: 0,
      timesWrong: 0,
      intervalIndex: 0,
      easeFactor: 2.5,
    };

    const reviewed = reviewWordWithDifficulty(existing, rating);
    const tracked = mode === "production"
      ? recordProductionAttempt(reviewed, rating !== "repeat")
      : recordRecognitionAttempt(reviewed, rating !== "repeat");
    const updated = {
      ...state.progress,
      vocabularyProgress: {
        ...state.progress.vocabularyProgress,
        [wordId]: tracked,
      },
    };

    saveProgressLocal(updated);
    set({ progress: updated });
    await saveProgressToSupabase(updated);

    if (state.userId) {
      addEvent({
        type: "vocabulary_review",
        userId: state.userId,
        timestamp: new Date().toISOString(),
        payload: {
          wordId,
          rating,
          mode,
          reviewedAt: new Date().toISOString(),
        },
      });
      scheduleSync(state.userId);
    }
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
      streak: updateStreakForDate(state.progress.streak),
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

    if (state.userId) {
      addEvent({
        type: "settings_changed",
        userId: state.userId,
        timestamp: new Date().toISOString(),
        payload: { settings: updated.settings },
      });
      scheduleSync(state.userId);
    }
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
