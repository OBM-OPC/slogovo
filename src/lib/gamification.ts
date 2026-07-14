import type { UserProgress } from "@/types";

const DAILY_GOAL_MINUTES: Record<UserProgress["settings"]["dailyGoal"], number> = {
  light: 5,
  medium: 15,
  intense: 30,
};

export interface LearningMetrics {
  masteredWords: number;
  distinctReviewDays: number;
  productionAttempts: number;
  masteredGrammarLessons: number;
  activeMinutes: number;
  weeklyGoalDays: number;
  weeklyLessons: number;
  listeningCorrect: number;
  listeningTotal: number;
}

function dateKey(value?: string): string | null {
  if (!value) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? null;
}

export function learningMetrics(progress: UserProgress, now = new Date()): LearningMetrics {
  const vocabulary = Object.values(progress.vocabularyProgress);
  const distinctReviewDays = new Set(vocabulary.map((item) => dateKey(item.lastReviewed)).filter(Boolean)).size;
  const activeSeconds = Object.values(progress.dailyStats).reduce(
    (sum, day) => sum + (day.activeSeconds ?? Math.round(day.minutes * 60)),
    0
  );
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const goalMinutes = DAILY_GOAL_MINUTES[progress.settings.dailyGoal];
  const weeklyGoalDays = Object.entries(progress.dailyStats).filter(([date, day]) => {
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed >= weekStart && parsed <= now && day.minutes >= goalMinutes;
  }).length;
  const weeklyLessons = Object.entries(progress.dailyStats).filter(([date]) => {
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed >= weekStart && parsed <= now;
  }).reduce((sum, [, day]) => sum + (day.lessons ?? 0), 0);

  return {
    masteredWords: vocabulary.filter((item) => item.status === "mastered").length,
    distinctReviewDays,
    productionAttempts: vocabulary.reduce((sum, item) => sum + (item.productionTotal ?? 0), 0),
    masteredGrammarLessons: progress.masteredLessons.length,
    activeMinutes: Math.floor(activeSeconds / 60),
    weeklyGoalDays,
    weeklyLessons,
    listeningCorrect: progress.exerciseStats.listeningCorrect ?? 0,
    listeningTotal: progress.exerciseStats.listeningTotal ?? 0,
  };
}
