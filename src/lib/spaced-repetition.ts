import { VocabularyProgress, SPACED_REPETITION_INTERVALS, VocabularyItem } from "@/types";
import { todayISO, addDays } from "./utils";

export type VocabCategory = "due" | "new" | "learning" | "mastered";

type DifficultyRating = "repeat" | "hard" | "good" | "easy";

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

function nextEaseFactor(easeFactor: number, rating: DifficultyRating): number {
  let next = easeFactor;
  switch (rating) {
    case "repeat":
      next = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;
    case "hard":
      next = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      break;
    case "good":
      // unchanged
      break;
    case "easy":
      next = easeFactor + 0.15;
      break;
  }
  return Math.max(MIN_EASE_FACTOR, next);
}

export function reviewWord(
  progress: VocabularyProgress,
  known: boolean
): VocabularyProgress {
  const today = todayISO();
  const nextIntervalIndex = known
    ? Math.min(progress.intervalIndex + 1, SPACED_REPETITION_INTERVALS.length - 1)
    : 0;

  return {
    ...progress,
    status: known ? "review" : "difficult",
    timesCorrect: progress.timesCorrect + (known ? 1 : 0),
    timesWrong: progress.timesWrong + (known ? 0 : 1),
    lastReviewed: today,
    intervalIndex: nextIntervalIndex,
    nextReview: addDays(today, SPACED_REPETITION_INTERVALS[nextIntervalIndex]),
    easeFactor: progress.easeFactor ?? DEFAULT_EASE_FACTOR,
  };
}

export function reviewWordWithDifficulty(
  progress: VocabularyProgress,
  rating: DifficultyRating
): VocabularyProgress {
  const today = todayISO();
  const ease = nextEaseFactor(progress.easeFactor ?? DEFAULT_EASE_FACTOR, rating);
  let nextInterval: number;

  if (rating === "repeat") {
    nextInterval = 0;
  } else {
    const baseInterval =
      progress.lastReviewed && progress.nextReview
        ? Math.max(
            1,
            Math.round(
              (new Date(progress.nextReview).getTime() - new Date(progress.lastReviewed).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : SPACED_REPETITION_INTERVALS[progress.intervalIndex ?? 0];

    if (rating === "hard") {
      nextInterval = Math.max(1, Math.round(baseInterval * (1 / Math.max(1.2, ease - 1))));
    } else {
      nextInterval = Math.round(baseInterval * ease);
    }

    // Cap to standard intervals for good, allow extra for easy
    if (rating === "good") {
      const maxGood = SPACED_REPETITION_INTERVALS[Math.min(progress.intervalIndex + 1, SPACED_REPETITION_INTERVALS.length - 1)];
      nextInterval = Math.min(nextInterval, maxGood);
    }
  }

  const known = rating !== "repeat";
  const status = rating === "repeat" ? "difficult" : rating === "easy" ? "mastered" : "review";

  return {
    ...progress,
    status,
    timesCorrect: progress.timesCorrect + (known ? 1 : 0),
    timesWrong: progress.timesWrong + (known ? 0 : 1),
    lastReviewed: today,
    intervalIndex: SPACED_REPETITION_INTERVALS.findIndex((i) => i >= nextInterval),
    nextReview: addDays(today, nextInterval),
    easeFactor: ease,
  };
}

export function isDueForReview(progress: VocabularyProgress): boolean {
  if (!progress.nextReview) return true;
  return progress.nextReview <= todayISO();
}

export function masteryLevel(progress: VocabularyProgress): number {
  const total = progress.timesCorrect + progress.timesWrong;
  if (total === 0) return 0;
  return Math.round((progress.timesCorrect / total) * 100);
}

export function shouldReviewToday(progress: VocabularyProgress): boolean {
  return progress.nextReview ? progress.nextReview <= todayISO() : true;
}

// ── NEW: Spaced-repetition category helpers for the trainer ──

/** Determine which SR category a word falls into based on its progress */
export function getVocabCategory(progress: VocabularyProgress | undefined): VocabCategory {
  if (!progress || (progress.timesCorrect === 0 && progress.timesWrong === 0)) return "new";
  if (progress.status === "mastered") return "mastered";
  if (isDueForReview(progress)) return "due";
  return "learning";
}

/** Sort words by spaced-repetition priority: due > new > learning > mastered */
export function sortBySpacedRepetition(
  words: VocabularyItem[],
  vocabProgress: Record<string, VocabularyProgress>
): VocabularyItem[] {
  const categoryPriority: Record<VocabCategory, number> = {
    due: 0,
    new: 1,
    learning: 2,
    mastered: 3,
  };

  return [...words].sort((a, b) => {
    const catA = categoryPriority[getVocabCategory(vocabProgress[a.id])];
    const catB = categoryPriority[getVocabCategory(vocabProgress[b.id])];
    if (catA !== catB) return catA - catB;

    // Secondary sort: within "due", show older reviews first
    const progA = vocabProgress[a.id];
    const progB = vocabProgress[b.id];
    if (progA?.nextReview && progB?.nextReview) {
      return progA.nextReview.localeCompare(progB.nextReview);
    }
    return 0;
  });
}

/** Get counts for each category */
export function getCategoryCounts(
  words: VocabularyItem[],
  vocabProgress: Record<string, VocabularyProgress>
): Record<VocabCategory, number> {
  const counts: Record<VocabCategory, number> = { due: 0, new: 0, learning: 0, mastered: 0 };
  for (const word of words) {
    const category = getVocabCategory(vocabProgress[word.id]);
    counts[category]++;
  }
  return counts;
}
