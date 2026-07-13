import {
  AudioComprehensionItem,
  DictationItem,
  ExerciseResultStatus,
  ListenExerciseItem,
  ListenReorderItem,
  ListenSelectItem,
  ListenTypeItem,
} from "@/types";
import {
  authoredAnswerOptions,
  evaluateAnswerDetailed,
  type DetailedAnswerEvaluation,
} from "./answer-evaluation";
import {
  buildEvaluationFeedback,
  formatRichFeedback,
  type RichStatus,
} from "./feedback";

export interface ListenResult {
  correct: boolean;
  status: ExerciseResultStatus;
  richStatus: RichStatus;
  feedback: string;
  acceptedAnswers: string[];
}

export function evaluateListenSelect(item: ListenSelectItem, selectedOptionId: string): ListenResult {
  const correctOption = item.options.find((option) => option.id === item.correctOptionId);
  const correct = selectedOptionId === item.correctOptionId;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    richStatus: correct ? "correct" : "incorrect",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${correctOption?.de ?? correctOption?.bg ?? ""}`,
    acceptedAnswers: [correctOption?.id ?? item.correctOptionId],
  };
}

function typedResult(
  evaluation: DetailedAnswerEvaluation,
  acceptedAnswers: string[]
): ListenResult {
  const feedback = buildEvaluationFeedback(evaluation, acceptedAnswers);
  return {
    correct: evaluation.status === "correct" || evaluation.status === "typo",
    status: evaluation.status,
    richStatus: evaluation.richStatus,
    feedback: formatRichFeedback(feedback),
    acceptedAnswers,
  };
}

export function evaluateListenType(item: ListenTypeItem, userAnswer: string): ListenResult {
  const primary = item.acceptedAnswers[0] ?? "";
  const evaluation = evaluateAnswerDetailed(userAnswer, {
    ...authoredAnswerOptions(primary, item.acceptedAnswers),
    allowOmittedSubjectPronoun: item.allowOmittedSubjectPronoun,
  });
  return typedResult(evaluation, item.acceptedAnswers);
}

export function evaluateDictation(item: DictationItem, userAnswer: string): ListenResult {
  const acceptedAnswers = [
    item.audioText,
    ...(item.acceptedVariants ?? []),
    ...(item.acceptedTransliterations ?? []),
  ];
  const evaluation = evaluateAnswerDetailed(userAnswer, {
    acceptedAnswers: [item.audioText],
    acceptedVariants: item.acceptedVariants,
    acceptedTransliterations: item.acceptedTransliterations,
    allowOmittedSubjectPronoun: item.allowOmittedSubjectPronoun,
  });
  return typedResult(evaluation, acceptedAnswers);
}

export function evaluateListenReorder(item: ListenReorderItem, selectedOrder: string[]): ListenResult {
  const userAnswer = selectedOrder.join(" ");
  const acceptedAnswer = item.correctOrder.join(" ");
  const correct = userAnswer === acceptedAnswer;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    richStatus: correct ? "correct" : "incorrect",
    feedback: correct ? "Richtig!" : `Richtige Reihenfolge: ${acceptedAnswer}`,
    acceptedAnswers: [acceptedAnswer],
  };
}

/** Multiset subtraction keeps repeated words available exactly as often as authored. */
export function remainingReorderWords(correctOrder: string[], selectedOrder: string[]): string[] {
  const remaining = [...correctOrder];
  for (const selected of selectedOrder) {
    const index = remaining.indexOf(selected);
    if (index >= 0) remaining.splice(index, 1);
  }
  return remaining;
}

export function evaluateAudioComprehension(item: AudioComprehensionItem, selectedOptionIndex: number): ListenResult {
  const correct = selectedOptionIndex === item.correctOptionIndex;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    richStatus: correct ? "correct" : "incorrect",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${item.options[item.correctOptionIndex]}`,
    acceptedAnswers: [item.options[item.correctOptionIndex]],
  };
}

export function isProductiveListenItem(item: ListenExerciseItem): boolean {
  return item.format === "listen-type" || item.format === "dictation" || item.format === "listen-reorder";
}
