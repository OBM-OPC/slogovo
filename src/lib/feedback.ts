import { AnswerFeedbackStatus, ExerciseResultStatus } from "@/types/learning";
import type { DetailedAnswerEvaluation } from "./answer-evaluation";

export type RichStatus = AnswerFeedbackStatus;

export interface RichFeedback {
  status: RichStatus;
  /** Short learner-facing message in German. */
  message: string;
  /** Optional longer explanation. */
  explanation?: string;
  /** Normalized user answer. */
  normalizedUser?: string;
  /** Best matching accepted answer. */
  matchedAnswer?: string;
  /** Marked user answer for highlighting differences. */
  highlightedUser?: string;
  /** Marked expected answer for highlighting differences. */
  highlightedExpected?: string;
  /** Whether the content author should review this feedback. */
  needsNativeReview: boolean;
}

const MESSAGES: Record<RichStatus, string> = {
  correct: "Richtig!",
  correct_with_typo: "Fast richtig – achte auf die Schreibung.",
  accepted_variant: "Richtig! Das ist eine akzeptierte Alternative.",
  partially_correct: "Teilweise richtig. Es fehlt noch etwas.",
  wrong_form: "Das ist die falsche Form. Überprüfe die Grammatik.",
  wrong_word: "Das ist nicht das gesuchte Wort.",
  missing_word: "Dir fehlt ein Wort.",
  incorrect: "Leider nicht richtig.",
};

export function statusToRich(status: ExerciseResultStatus): RichStatus {
  switch (status) {
    case "correct":
      return "correct";
    case "typo":
      return "correct_with_typo";
    case "wrong-form":
      return "wrong_form";
    case "wrong":
      return "incorrect";
    case "skipped":
      return "missing_word";
  }
}

export function buildRichFeedback(
  status: ExerciseResultStatus,
  userAnswer: string,
  acceptedAnswers: string[],
  normalizedUser?: string,
  matchedAnswer?: string,
  explanation?: string,
  needsNativeReview = false,
  richStatusOverride?: RichStatus
): RichFeedback {
  const richStatus = richStatusOverride ?? statusToRich(status);
  const bestMatch = matchedAnswer ?? acceptedAnswers[0] ?? "";

  return {
    status: richStatus,
    message: MESSAGES[richStatus],
    explanation,
    normalizedUser,
    matchedAnswer: bestMatch,
    highlightedUser: normalizedUser,
    highlightedExpected: bestMatch,
    needsNativeReview,
  };
}

export function buildEvaluationFeedback(
  evaluation: DetailedAnswerEvaluation,
  acceptedAnswers: string[],
  explanation?: string,
  needsNativeReview = false
): RichFeedback {
  return buildRichFeedback(
    evaluation.status,
    evaluation.normalizedUser,
    acceptedAnswers,
    evaluation.normalizedUser,
    evaluation.matchedAnswer,
    explanation,
    needsNativeReview,
    evaluation.richStatus
  );
}

export function formatRichFeedback(feedback: RichFeedback): string {
  if (feedback.status === "correct" || feedback.status === "accepted_variant") {
    return feedback.message;
  }
  if (feedback.status === "correct_with_typo") {
    return feedback.matchedAnswer
      ? `${feedback.message} Schreibweise: ${feedback.matchedAnswer}`
      : feedback.message;
  }
  return feedback.matchedAnswer
    ? `${feedback.message} Richtige Antwort: ${feedback.matchedAnswer}`
    : feedback.message;
}
