import { ExerciseResult, LessonAttempt } from "@/types/learning";
import { calculateLessonMetrics } from "./evaluation";
import { msToRoundedMinutes, msToSeconds } from "./active-time";

export interface LessonPerformanceSummary {
  lessonId: string;
  passed: boolean;
  accuracy: number;
  score: number;
  firstTryCorrect: number;
  itemsAnswered: number;
  totalDurationMs: number;
  activeMinutes: number;
  xpEarned: number;
  weakVocabularyIds: string[];
  strongVocabularyIds: string[];
  feedback: string;
}

export function buildLessonPerformanceSummary(attempt: LessonAttempt): LessonPerformanceSummary {
  const metrics = calculateLessonMetrics(attempt.results);

  const vocabStats = new Map<
    string,
    { correct: number; total: number }
  >();

  for (const result of attempt.results) {
    if (!result.vocabularyId) continue;
    const stat = vocabStats.get(result.vocabularyId) ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (result.isPassing) stat.correct += 1;
    vocabStats.set(result.vocabularyId, stat);
  }

  const weakVocabularyIds: string[] = [];
  const strongVocabularyIds: string[] = [];
  for (const [vocabId, stat] of vocabStats.entries()) {
    const ratio = stat.correct / stat.total;
    if (ratio < 0.5) {
      weakVocabularyIds.push(vocabId);
    } else if (ratio >= 1) {
      strongVocabularyIds.push(vocabId);
    }
  }

  let feedback: string;
  if (attempt.passed) {
    feedback = `Gut gemacht! ${Math.round(metrics.accuracy * 100)}% richtig.`;
  } else if (metrics.accuracy >= 0.5) {
    feedback = `Fast! ${Math.round((1 - metrics.accuracy) * 100)}% der Antworten brauchen noch Übung.`;
  } else {
    feedback = "Diese Lektion braucht noch Wiederholung. Konzentriere dich auf die markierten Vokabeln.";
  }

  return {
    lessonId: attempt.lessonId,
    passed: attempt.passed,
    accuracy: metrics.accuracy,
    score: metrics.score,
    firstTryCorrect: metrics.firstTryCorrect,
    itemsAnswered: metrics.itemsAnswered,
    totalDurationMs: attempt.totalDurationMs,
    activeMinutes: msToRoundedMinutes(attempt.totalDurationMs),
    xpEarned: attempt.xpEarned,
    weakVocabularyIds,
    strongVocabularyIds,
    feedback,
  };
}
