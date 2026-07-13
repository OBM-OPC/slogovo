import { ExerciseType, LessonAttempt } from "@/types/learning";
import { firstItemAttempts } from "./evaluation";
import { msToRoundedMinutes } from "./active-time";

export interface LessonSkillPerformance {
  exerciseType: ExerciseType;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

export type RecommendedLessonAction =
  | "retry-lesson"
  | "review-weak-items"
  | "continue-course";

export interface LessonPerformanceSummary {
  lessonId: string;
  passed: boolean;
  mastered: boolean;
  accuracy: number;
  score: number;
  firstTryCorrect: number;
  itemsAnswered: number;
  correctCount: number;
  incorrectCount: number;
  totalDurationMs: number;
  activeTimeSeconds: number;
  activeMinutes: number;
  xpEarned: number;
  weakVocabularyIds: string[];
  masteredVocabularyIds: string[];
  skillPerformance: LessonSkillPerformance[];
  strongestSkill?: LessonSkillPerformance;
  weakestSkill?: LessonSkillPerformance;
  recommendedAction: RecommendedLessonAction;
  recommendedActionLabel: string;
  feedback: string;
}

const SKILL_ORDER: ExerciseType[] = [
  "quiz",
  "matching",
  "fill-in",
  "sentence-builder",
  "listen",
  "typing",
];

const SKILL_LABELS: Record<ExerciseType, string> = {
  quiz: "Auswahl",
  matching: "Zuordnung",
  "fill-in": "Schreiben",
  "sentence-builder": "Satzbau",
  listen: "Hörverstehen",
  typing: "Tippen",
};

function buildSkillPerformance(attempt: LessonAttempt): LessonSkillPerformance[] {
  const stats = new Map<ExerciseType, { correct: number; total: number }>();

  for (const result of firstItemAttempts(attempt.results)) {
    const stat = stats.get(result.exerciseType) ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (result.isPassing) stat.correct += 1;
    stats.set(result.exerciseType, stat);
  }

  return SKILL_ORDER.flatMap((exerciseType) => {
    const stat = stats.get(exerciseType);
    if (!stat) return [];
    return [{
      exerciseType,
      label: SKILL_LABELS[exerciseType],
      correct: stat.correct,
      total: stat.total,
      accuracy: stat.total === 0 ? 0 : stat.correct / stat.total,
    }];
  });
}

function selectSkill(
  skills: LessonSkillPerformance[],
  direction: "strongest" | "weakest"
): LessonSkillPerformance | undefined {
  return skills.reduce<LessonSkillPerformance | undefined>((selected, skill) => {
    if (!selected) return skill;
    if (direction === "strongest" && skill.accuracy > selected.accuracy) return skill;
    if (direction === "weakest" && skill.accuracy < selected.accuracy) return skill;
    return selected;
  }, undefined);
}

export function buildLessonPerformanceSummary(attempt: LessonAttempt): LessonPerformanceSummary {
  const vocabStats = new Map<
    string,
    { correct: number; total: number }
  >();

  for (const result of firstItemAttempts(attempt.results)) {
    if (!result.vocabularyId) continue;
    const stat = vocabStats.get(result.vocabularyId) ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (result.isPassing) stat.correct += 1;
    vocabStats.set(result.vocabularyId, stat);
  }

  const weakVocabularyIds: string[] = [];
  const masteredVocabularyIds: string[] = [];
  for (const [vocabId, stat] of vocabStats.entries()) {
    if (stat.correct < stat.total) {
      weakVocabularyIds.push(vocabId);
    } else {
      masteredVocabularyIds.push(vocabId);
    }
  }

  const skillPerformance = buildSkillPerformance(attempt);
  const strongestSkill = selectSkill(skillPerformance, "strongest");
  const weakestSkill = selectSkill(skillPerformance, "weakest");

  let recommendedAction: RecommendedLessonAction;
  let recommendedActionLabel: string;
  if (!attempt.passed) {
    recommendedAction = "retry-lesson";
    recommendedActionLabel = "Wiederhole die Lektion und konzentriere dich auf die schwierigen Aufgaben.";
  } else if (weakVocabularyIds.length > 0) {
    recommendedAction = "review-weak-items";
    recommendedActionLabel = "Wiederhole die Lektion, um die markierten Vokabeln zu festigen.";
  } else {
    recommendedAction = "continue-course";
    recommendedActionLabel = attempt.mastered
      ? "Sehr sicher! Fahre mit der nächsten Lektion fort."
      : "Gut geschafft. Fahre fort und plane später eine kurze Wiederholung.";
  }

  let feedback: string;
  if (attempt.passed) {
    feedback = `Gut gemacht! ${Math.round(attempt.accuracy * 100)}% richtig.`;
  } else if (attempt.accuracy >= 0.5) {
    feedback = `Fast! ${Math.round((1 - attempt.accuracy) * 100)}% der Antworten brauchen noch Übung.`;
  } else {
    feedback = "Diese Lektion braucht noch Wiederholung. Konzentriere dich auf die schwierigen Aufgaben.";
  }

  return {
    lessonId: attempt.lessonId,
    passed: attempt.passed,
    mastered: attempt.mastered,
    accuracy: attempt.accuracy,
    score: attempt.score,
    firstTryCorrect: attempt.firstTryCorrect,
    itemsAnswered: attempt.itemsAnswered,
    correctCount: attempt.correctCount,
    incorrectCount: attempt.incorrectCount,
    totalDurationMs: attempt.totalDurationMs,
    activeTimeSeconds: attempt.activeTimeSeconds,
    activeMinutes: msToRoundedMinutes(attempt.activeTimeSeconds * 1000),
    xpEarned: attempt.xpEarned,
    weakVocabularyIds,
    masteredVocabularyIds,
    skillPerformance,
    strongestSkill,
    weakestSkill,
    recommendedAction,
    recommendedActionLabel,
    feedback,
  };
}
