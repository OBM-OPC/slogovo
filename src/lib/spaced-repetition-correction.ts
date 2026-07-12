import { VocabularyProgress } from "@/types";

/**
 * Records an immediate in-lesson correction attempt. This does NOT update the
 * spaced-repetition schedule; it only tracks short-term reinforcement.
 */
export function recordCorrectionAttempt(
  progress: VocabularyProgress,
  correct: boolean
): VocabularyProgress {
  return {
    ...progress,
    timesCorrect: progress.timesCorrect + (correct ? 1 : 0),
    timesWrong: progress.timesWrong + (correct ? 0 : 1),
    // Preserve status/interval/nextReview from the last real review.
  };
}
