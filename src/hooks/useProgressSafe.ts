"use client";

import { useProgressStore } from "@/stores/useProgressStore";
import { UserProgress } from "@/types";

const emptyProgress: UserProgress = {
  userId: "",
  streak: { current: 0, longest: 0 },
  completedLessons: [],
  masteredLessons: [],
  completedModules: [],
  vocabularyProgress: {},
  lessonScores: {},
  exerciseStats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
  dailyStats: {},
  recordedAttemptIds: [],
  settings: {
    dailyGoal: "medium",
    weeklyLessonGoal: 3,
    alphabetCompleted: false,
    ttsEnabled: true,
    showLatin: true,
    speechRate: 0.9,
    onboarding: {
      completed: false,
      knowsCyrillic: false,
      priorBulgarian: "none",
      knowsSlavicLanguage: false,
      learningGoal: "travel",
      recommendedPath: "alphabet",
    },
  },
  achievements: [],
};

/**
 * Safe progress hook — never returns null.
 * Returns empty progress while loading, then real data.
 */
export function useProgressSafe(): UserProgress {
  const progress = useProgressStore((state) => state.progress);
  return progress ?? emptyProgress;
}

export function useProgressInitialized(): boolean {
  return useProgressStore((state) => state.initialized);
}

export function useProgressSyncing(): boolean {
  return useProgressStore((state) => state.syncing);
}
