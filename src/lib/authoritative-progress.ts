import type { DifficultyRating, UserProgress, VocabularyProgress } from "@/types";
import { checkAchievements } from "./achievements";
import { getAllModules } from "./content";
import { defaultProgress } from "./progress-serialization";
import { recordProductionAttempt, recordRecognitionAttempt } from "./mastery-tracking";
import { reviewWordWithDifficulty } from "./spaced-repetition";
import { updateStreakForDate } from "./streak";

export interface AuthoritativeAttemptRow {
  id: string;
  lesson_id: string;
  module_id: string;
  active_time_seconds: number;
  finished_at: string | null;
  items_answered: number;
  correct_count: number;
  incorrect_count: number;
  passed: boolean;
  mastered: boolean;
  score: number;
}

export interface AuthoritativeReviewRow {
  word_id: string;
  rating: DifficultyRating;
  practice_mode: "recognition" | "production";
  reviewed_at: string;
  response_time_ms?: number | null;
  error_category?: VocabularyProgress["lastErrorCategory"] | null;
}

function emptyVocabularyProgress(): VocabularyProgress {
  return {
    status: "new",
    timesCorrect: 0,
    timesWrong: 0,
    intervalIndex: 0,
    easeFactor: 2.5,
  };
}

export function buildAuthoritativeProgress(
  userId: string,
  attempts: AuthoritativeAttemptRow[],
  reviews: AuthoritativeReviewRow[],
  settings: UserProgress["settings"]
): UserProgress {
  const progress = defaultProgress(userId);
  progress.settings = settings;

  for (const attempt of [...attempts].sort((a, b) => (a.finished_at ?? "").localeCompare(b.finished_at ?? ""))) {
    progress.recordedAttemptIds.push(attempt.id);
    progress.lessonScores[attempt.lesson_id] = Math.max(
      progress.lessonScores[attempt.lesson_id] ?? 0,
      attempt.score
    );
    if (attempt.passed && !progress.completedLessons.includes(attempt.lesson_id)) {
      progress.completedLessons.push(attempt.lesson_id);
    }
    if (attempt.mastered && !progress.masteredLessons.includes(attempt.lesson_id)) {
      progress.masteredLessons.push(attempt.lesson_id);
    }
    progress.exerciseStats.total += attempt.correct_count + attempt.incorrect_count;
    progress.exerciseStats.correct += attempt.correct_count;
    progress.exerciseStats.wrong += attempt.incorrect_count;
    progress.exerciseStats.consecutiveCorrect = attempt.incorrect_count > 0
      ? 0
      : (progress.exerciseStats.consecutiveCorrect ?? 0) + attempt.correct_count;

    if (attempt.finished_at) {
      const date = attempt.finished_at.slice(0, 10);
      const day = progress.dailyStats[date] ?? { minutes: 0, vocabulary: 0, activeSeconds: 0 };
      const activeSeconds = Math.max(0, attempt.active_time_seconds);
      progress.dailyStats[date] = {
        ...day,
        minutes: day.minutes + activeSeconds / 60,
        activeSeconds: (day.activeSeconds ?? 0) + activeSeconds,
      };
      if (attempt.passed && attempt.items_answered > 0 && activeSeconds > 0) {
        progress.streak = updateStreakForDate(progress.streak, new Date(`${date}T12:00:00Z`));
      }
    }
  }

  for (const courseModule of getAllModules()) {
    if (courseModule.lessons.length > 0 && courseModule.lessons.every((lesson) => progress.completedLessons.includes(lesson.lessonId))) {
      progress.completedModules.push(courseModule.moduleId);
    }
  }

  for (const review of [...reviews].sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at))) {
    const current = progress.vocabularyProgress[review.word_id] ?? emptyVocabularyProgress();
    const scheduled = reviewWordWithDifficulty(current, review.rating, {
      reviewedAt: new Date(review.reviewed_at),
      responseTimeMs: review.response_time_ms ?? undefined,
      errorCategory: review.error_category ?? undefined,
    });
    progress.vocabularyProgress[review.word_id] = review.practice_mode === "production"
      ? recordProductionAttempt(scheduled, review.rating !== "repeat")
      : recordRecognitionAttempt(scheduled, review.rating !== "repeat");
    const date = review.reviewed_at.slice(0, 10);
    const day = progress.dailyStats[date] ?? { minutes: 0, vocabulary: 0, activeSeconds: 0 };
    progress.dailyStats[date] = { ...day, vocabulary: day.vocabulary + 1 };
  }

  progress.achievements = checkAchievements(progress);
  return progress;
}
