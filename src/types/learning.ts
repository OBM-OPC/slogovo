import { VocabularyItem } from "./vocabulary";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _vocabTypeRef: VocabularyItem | undefined = undefined;
void _vocabTypeRef;

export type ExerciseResultStatus =
  | "correct"
  | "typo"
  | "wrong-form"
  | "wrong"
  | "skipped";

export type ExerciseType =
  | "quiz"
  | "fill-in"
  | "matching"
  | "sentence-builder"
  | "listen"
  | "typing";

export interface ExerciseResult {
  /** Stable id of the exercise within the lesson. */
  exerciseId: string;
  /** Type of exercise. */
  exerciseType: ExerciseType;
  /** Id of the specific item/question answered. */
  itemId: string;
  /** Status of the evaluation. */
  status: ExerciseResultStatus;
  /** Whether the result counts as passing the item. */
  isPassing: boolean;
  /** Normalized user answer, if any. */
  userAnswer?: string;
  /** Accepted correct answer(s). */
  correctAnswers?: string[];
  /** Optional feedback/explanation shown to the learner. */
  feedback?: string;
  /** Whether the item needs a native review for the feedback text. */
  feedbackNeedsReview?: boolean;
  /** Milliseconds spent actively on this item. */
  durationMs: number;
  /** ISO timestamp of the answer. */
  answeredAt: string;
  /** Vocabulary item involved, if relevant. */
  vocabularyId?: string;
}

export interface LessonAttempt {
  /** Unique attempt id (uuid). */
  id: string;
  userId: string;
  lessonId: string;
  moduleId: string;
  level: string;
  /** Results for each answered exercise item. */
  results: ExerciseResult[];
  /** Total active time in milliseconds. */
  totalDurationMs: number;
  /** ISO timestamp when the attempt started. */
  startedAt: string;
  /** ISO timestamp when the attempt finished. */
  finishedAt?: string;
  /** Number of first-try correct answers. */
  firstTryCorrect: number;
  /** Number of items answered. */
  itemsAnswered: number;
  /** Whether the attempt met the passing criteria. */
  passed: boolean;
  /** Whether the attempt was completed (reached summary). */
  completed: boolean;
  /** Accuracy as a fraction 0..1. */
  accuracy: number;
  /** Optional score derived from the evaluator, not UI. */
  score: number;
  /** XP earned from this attempt. */
  xpEarned: number;
}

export interface MasteryAttemptSummary {
  lessonId: string;
  attempts: LessonAttempt[];
  bestAccuracy: number;
  passedOnce: boolean;
}

export type EvaluationResult = Pick<
  ExerciseResult,
  "status" | "isPassing" | "correctAnswers" | "feedback" | "feedbackNeedsReview"
>;

export interface TypedAnswerEvaluator {
  evaluate(answer: string, accepted: string[]): ExerciseResultStatus;
}

export interface MistakeQueueItem {
  vocabularyId: string;
  originalResult: ExerciseResult;
  retryCount: number;
}
