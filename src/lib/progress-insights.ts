import type { ExerciseType, UserProgress, VocabularyProgress } from "@/types";

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
  vocabularyDue: number;
  receptiveVocabularyMastered: number;
  productiveVocabularyMastered: number;
  grammarSkills: GrammarSkillSummary[];
  listening: { correct: number; total: number; accuracy: number | null };
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
  today: string
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

  return {
    activeStudyMinutes: Math.floor(activeSeconds / 60),
    lessonsPassed: progress.completedLessons.length,
    lessonsMastered: progress.masteredLessons.length,
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
    weakAreas,
    recentImprovement,
  };
}
