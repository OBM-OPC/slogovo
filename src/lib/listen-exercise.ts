import {
  AudioComprehensionItem,
  DictationItem,
  ExerciseResultStatus,
  ListenExerciseItem,
  ListenReorderItem,
  ListenSelectItem,
  ListenTypeItem,
} from "@/types";
import { evaluateAnswer } from "./answer-evaluation";

export interface ListenResult {
  correct: boolean;
  status: ExerciseResultStatus;
  feedback: string;
  acceptedAnswers: string[];
}

export function evaluateListenSelect(item: ListenSelectItem, selectedOptionId: string): ListenResult {
  const correctOption = item.options.find((option) => option.id === item.correctOptionId);
  const correct = selectedOptionId === item.correctOptionId;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${correctOption?.de ?? correctOption?.bg ?? ""}`,
    acceptedAnswers: [correctOption?.id ?? item.correctOptionId],
  };
}

export function evaluateListenType(item: ListenTypeItem, userAnswer: string): ListenResult {
  const status = evaluateAnswer(userAnswer, { acceptedAnswers: item.acceptedAnswers });
  return {
    correct: status === "correct" || status === "typo",
    status,
    feedback: status === "correct" ? "Richtig!" : `Richtige Antwort: ${item.acceptedAnswers[0]}`,
    acceptedAnswers: item.acceptedAnswers,
  };
}

export function evaluateDictation(item: DictationItem, userAnswer: string): ListenResult {
  const status = evaluateAnswer(userAnswer, { acceptedAnswers: [item.audioText], strict: true });
  return {
    correct: status === "correct",
    status,
    feedback: status === "correct" ? "Richtig!" : `Richtige Antwort: ${item.audioText}`,
    acceptedAnswers: [item.audioText],
  };
}

export function evaluateListenReorder(item: ListenReorderItem, selectedOrder: string[]): ListenResult {
  const userAnswer = selectedOrder.join(" ");
  const acceptedAnswer = item.correctOrder.join(" ");
  const correct = userAnswer === acceptedAnswer;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Reihenfolge: ${acceptedAnswer}`,
    acceptedAnswers: [acceptedAnswer],
  };
}

export function evaluateAudioComprehension(item: AudioComprehensionItem, selectedOptionIndex: number): ListenResult {
  const correct = selectedOptionIndex === item.correctOptionIndex;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${item.options[item.correctOptionIndex]}`,
    acceptedAnswers: [item.options[item.correctOptionIndex]],
  };
}

export function isProductiveListenItem(item: ListenExerciseItem): boolean {
  return item.format === "listen-type" || item.format === "dictation" || item.format === "listen-reorder";
}
