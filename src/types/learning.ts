import type { VocabularyItem } from "./vocabulary";

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

export interface ExerciseItemResult {
  /** Stable id for this answer, used for idempotent synchronization. */
  id: string;
  /** Id of the specific item/question answered. */
  itemId: string;
  status: ExerciseResultStatus;
  /** Whether this answer satisfies the item. */
  isPassing: boolean;
  userAnswer?: string;
  acceptedAnswers: string[];
  feedback?: string;
  feedbackNeedsReview?: boolean;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  attemptNumber: number;
  hintsUsed: number;
  required: boolean;
  productive: boolean;
  vocabularyId?: string;
}

/**
 * Authoritative result returned by every rendered exercise component.
 * Item attempts remain nested so block completion cannot be confused with correctness.
 */
export interface ExerciseResult {
  exerciseId: string;
  exerciseType: ExerciseType;
  correctAnswers: number;
  incorrectAnswers: number;
  attempts: number;
  itemResults: ExerciseItemResult[];
  hintsUsed: number;
  startedAt: string;
  completedAt: string;
}

export interface LessonAttempt {
  id: string;
  userId: string;
  lessonId: string;
  moduleId: string;
  level: string;
  results: ExerciseResult[];
  totalDurationMs: number;
  activeTimeSeconds: number;
  startedAt: string;
  finishedAt?: string;
  firstTryCorrect: number;
  itemsAnswered: number;
  correctCount: number;
  incorrectCount: number;
  requiredScore: number;
  passed: boolean;
  mastered: boolean;
  /** Reached the end of all lesson screens, independent of pass/mastery. */
  completed: boolean;
  accuracy: number;
  score: number;
  xpEarned: number;
}

export interface MasteryAttemptSummary {
  lessonId: string;
  attempts: LessonAttempt[];
  bestAccuracy: number;
  passedOnce: boolean;
  masteredOnce: boolean;
}

export type EvaluationResult = Pick<
  ExerciseItemResult,
  "status" | "isPassing" | "acceptedAnswers" | "feedback" | "feedbackNeedsReview"
>;

export interface TypedAnswerEvaluator {
  evaluate(answer: string, accepted: string[]): ExerciseResultStatus;
}

export interface MistakeQueueItem {
  exerciseId: string;
  exerciseType: ExerciseType;
  itemId: string;
  originalResult: ExerciseItemResult;
  retryCount: number;
}

export type ListenFormat =
  | "listen-select"
  | "listen-type"
  | "dictation"
  | "listen-reorder"
  | "audio-comprehension";

interface ListenBaseItem {
  id: string;
  audioText: string;
  audioUrl?: string;
  required?: boolean;
  vocabularyId?: string;
}

export interface ListenSelectItem extends ListenBaseItem {
  format: "listen-select";
  options: VocabularyItem[];
  correctOptionId: string;
}

export interface ListenTypeItem extends ListenBaseItem {
  format: "listen-type";
  acceptedAnswers: string[];
}

export interface DictationItem extends ListenBaseItem {
  format: "dictation";
  wordCount?: number;
}

export interface ListenReorderItem extends ListenBaseItem {
  format: "listen-reorder";
  correctOrder: string[];
}

export interface AudioComprehensionItem extends ListenBaseItem {
  format: "audio-comprehension";
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export type ListenExerciseItem =
  | ListenSelectItem
  | ListenTypeItem
  | DictationItem
  | ListenReorderItem
  | AudioComprehensionItem;
