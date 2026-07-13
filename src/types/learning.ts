import type { VocabularyItem } from "./vocabulary";

export type ExerciseResultStatus =
  | "correct"
  | "typo"
  | "wrong-form"
  | "wrong"
  | "skipped";

export type AnswerFeedbackStatus =
  | "correct"
  | "correct_with_typo"
  | "accepted_variant"
  | "partially_correct"
  | "wrong_form"
  | "wrong_word"
  | "missing_word"
  | "incorrect";

export type ExerciseType =
  | "quiz"
  | "fill-in"
  | "matching"
  | "sentence-builder"
  | "listen"
  | "typing";

/**
 * A lesson-level pass gate. At least `minimumPassed` exercises from the listed
 * stable exercise IDs must have every required item answered correctly at
 * least once. The default minimum is one.
 */
export interface RequiredExerciseGroup {
  id: string;
  exerciseIds: string[];
  minimumPassed?: number;
}

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
  feedbackStatus?: AnswerFeedbackStatus;
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
  /** Authored normal-speed recording. TTS remains the final fallback. */
  audioUrl?: string;
  /** Optional authored slow recording; normal audio is slowed when absent. */
  slowAudioUrl?: string;
  /** Optional app-bundled/downloaded recording used when the network asset fails. */
  offlineAudioUrl?: string;
  /** Stable key for Cache Storage, independent from a signed remote URL. */
  audioCacheKey?: string;
  /** An authored hint; the transcript is never revealed implicitly. */
  revealText?: string;
  /** Maximum number of times the authored hint can be revealed. */
  maxReveals?: number;
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
  allowOmittedSubjectPronoun?: boolean;
}

export interface DictationItem extends ListenBaseItem {
  format: "dictation";
  wordCount?: number;
  acceptedVariants?: string[];
  acceptedTransliterations?: string[];
  allowOmittedSubjectPronoun?: boolean;
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
