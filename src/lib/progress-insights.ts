import type { ExerciseType, UserProgress, VocabularyProgress } from "@/types";
import { recommendedWeeklyLearningDays } from "@/lib/onboarding";

export interface AttemptSkillSummary {
  exerciseType: ExerciseType;
  correct: number;
  total: number;
}

export interface ProgressAttemptSummary {
  score: number;
  finishedAt?: string;
  skills: AttemptSkillSummary[];
}

export interface GrammarSkillSummary {
  lessonId: string;
  title: string;
  score: number;
}

export interface ProgressInsights {
  activeStudyMinutes: number;
  lessonsPassed: number;
  lessonsMastered: number;
  wordsLearned: number;
  vocabularyDue: number;
  receptiveVocabularyMastered: number;
  productiveVocabularyMastered: number;
  grammarSkills: GrammarSkillSummary[];
  listening: { correct: number; total: number; accuracy: number | null };
  grammar: { correct: number; total: number; accuracy: number | null };
  weeklyGoal: { completedDays: number; targetDays: number; percent: number };
  reviewCompletion: { completed: number; due: number; percent: number | null };
  weakAreas: Array<{ label: string; accuracy: number }>;
  recentImprovement: number | null;
}

const SKILL_LABELS: Record<ExerciseType, string> = {
  quiz: "Auswahl",
  matching: "Zuordnung",
  "fill-in": "Schreiben",
  "sentence-builder": "Satzbau",
  listen: "Hörverstehen",
  typing: "Tippen",
};

function rate(correct = 0, total = 0): number {
  return total === 0 ? 0 : correct / total;
}

function mastered(progress: VocabularyProgress, mode: "recognition" | "production"): boolean {
  const correct = mode === "recognition" ? progress.recognitionCorrect ?? 0 : progress.productionCorrect ?? 0;
  const total = mode === "recognition" ? progress.recognitionTotal ?? 0 : progress.productionTotal ?? 0;
  return total >= 3 && rate(correct, total) >= 0.7;
}

export function buildProgressInsights(
  progress: UserProgress,
  attempts: ProgressAttemptSummary[],
  grammarLessons: Array<{ lessonId: string; title: string }>,
  today: string,
  reviewSummary: { dueAtStart: number; completedDue: number } = { dueAtStart: 0, completedDue: 0 }
): ProgressInsights {
  const vocabulary = Object.values(progress.vocabularyProgress);
  const skillTotals = new Map<ExerciseType, { correct: number; total: number }>();
  for (const attempt of attempts) {
    for (const skill of attempt.skills) {
      const current = skillTotals.get(skill.exerciseType) ?? { correct: 0, total: 0 };
      current.correct += skill.correct;
      current.total += skill.total;
      skillTotals.set(skill.exerciseType, current);
    }
  }
  const listening = skillTotals.get("listen") ?? { correct: 0, total: 0 };
  const grammar = [skillTotals.get("fill-in"), skillTotals.get("sentence-builder")]
    .filter((value): value is { correct: number; total: number } => Boolean(value))
    .reduce((sum, value) => ({ correct: sum.correct + value.correct, total: sum.total + value.total }), { correct: 0, total: 0 });
  const weakAreas = [...skillTotals.entries()]
    .filter(([, stats]) => stats.total >= 2 && rate(stats.correct, stats.total) < 0.7)
    .map(([exerciseType, stats]) => ({ label: SKILL_LABELS[exerciseType], accuracy: rate(stats.correct, stats.total) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
  const chronological = [...attempts]
    .filter((attempt) => attempt.finishedAt)
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
  const recent = chronological.slice(0, 5);
  const previous = chronological.slice(5, 10);
  const average = (items: ProgressAttemptSummary[]) => items.reduce((sum, item) => sum + item.score, 0) / items.length;
  const recentImprovement = recent.length >= 2 && previous.length >= 2
    ? Math.round(average(recent) - average(previous))
    : null;
  const activeSeconds = Object.values(progress.dailyStats).reduce(
    (sum, day) => sum + (day.activeSeconds ?? Math.round(day.minutes * 60)),
    0
  );
  const targetDays = recommendedWeeklyLearningDays(progress.settings.dailyGoal);
  const dailyMinutes = progress.settings.dailyGoal === "light" ? 5 : progress.settings.dailyGoal === "medium" ? 15 : 30;
  const todayDate = new Date(`${today}T12:00:00Z`);
  const weekStart = new Date(todayDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const completedDays = Object.entries(progress.dailyStats).filter(([date, day]) => {
    const value = new Date(`${date}T12:00:00Z`);
    return value >= weekStart && value <= todayDate && day.minutes >= dailyMinutes;
  }).length;
  const wordsLearned = vocabulary.filter((item) => mastered(item, "recognition") || mastered(item, "production")).length;

  return {
    activeStudyMinutes: Math.floor(activeSeconds / 60),
    lessonsPassed: progress.completedLessons.length,
    lessonsMastered: progress.masteredLessons.length,
    wordsLearned,
    vocabularyDue: vocabulary.filter((item) => !item.nextReview || item.nextReview <= today).length,
    receptiveVocabularyMastered: vocabulary.filter((item) => mastered(item, "recognition")).length,
    productiveVocabularyMastered: vocabulary.filter((item) => mastered(item, "production")).length,
    grammarSkills: grammarLessons
      .filter((lesson) => progress.lessonScores[lesson.lessonId] !== undefined)
      .map((lesson) => ({ ...lesson, score: progress.lessonScores[lesson.lessonId] }))
      .sort((a, b) => a.score - b.score),
    listening: {
      ...listening,
      accuracy: listening.total === 0 ? null : rate(listening.correct, listening.total),
    },
    grammar: { ...grammar, accuracy: grammar.total === 0 ? null : rate(grammar.correct, grammar.total) },
    weeklyGoal: { completedDays, targetDays, percent: Math.min(100, Math.round((completedDays / targetDays) * 100)) },
    reviewCompletion: {
      completed: Math.min(reviewSummary.completedDue, reviewSummary.dueAtStart),
      due: reviewSummary.dueAtStart,
      percent: reviewSummary.dueAtStart === 0 ? null : Math.min(100, Math.round((reviewSummary.completedDue / reviewSummary.dueAtStart) * 100)),
    },
    weakAreas,
    recentImprovement,
  };
}
