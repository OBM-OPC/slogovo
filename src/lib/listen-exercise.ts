import { VocabularyItem } from "@/types";
import { evaluateAnswer } from "./answer-evaluation";
import { evaluateGrammarAwareAnswer } from "./grammar-aware-evaluation";

export type ListenFormat =
  | "listen-select"
  | "listen-type"
  | "dictation"
  | "listen-reorder"
  | "audio-comprehension";

export interface ListenSelectItem {
  id: string;
  audioText: string;
  options: VocabularyItem[];
  correctOptionId: string;
}

export interface ListenTypeItem {
  id: string;
  audioText: string;
  acceptedAnswers: string[];
}

export interface DictationItem {
  id: string;
  audioText: string;
  wordCount: number;
}

export interface ListenReorderItem {
  id: string;
  audioText: string;
  correctOrder: string[];
}

export interface AudioComprehensionItem {
  id: string;
  audioText: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export type ListenItem =
  | { format: "listen-select"; data: ListenSelectItem }
  | { format: "listen-type"; data: ListenTypeItem }
  | { format: "dictation"; data: DictationItem }
  | { format: "listen-reorder"; data: ListenReorderItem }
  | { format: "audio-comprehension"; data: AudioComprehensionItem };

export interface ListenResult {
  correct: boolean;
  status: "correct" | "typo" | "wrong-form" | "wrong" | "skipped";
  feedback: string;
}

export function evaluateListenSelect(item: ListenSelectItem, selectedOptionId: string): ListenResult {
  const correct = selectedOptionId === item.correctOptionId;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${item.options.find((o) => o.id === item.correctOptionId)?.de}`,
  };
}

export function evaluateListenType(
  item: ListenTypeItem,
  userAnswer: string,
  grammarOptions?: {
    pos?: "noun" | "verb" | "adjective" | "adverb" | "other";
    expectedGender?: "masculine" | "feminine" | "neuter";
  }
): ListenResult {
  if (!grammarOptions) {
    const status = evaluateAnswer(userAnswer, { acceptedAnswers: item.acceptedAnswers });
    return {
      correct: status === "correct" || status === "typo",
      status,
      feedback: status === "correct" ? "Richtig!" : `Richtige Antwort: ${item.acceptedAnswers[0]}`,
    };
  }

  const status = evaluateGrammarAwareAnswer(userAnswer, {
    acceptedAnswers: item.acceptedAnswers,
    ...grammarOptions,
  });
  return {
    correct: status === "correct" || status === "typo",
    status,
    feedback:
      status === "correct"
        ? "Richtig!"
        : status === "wrong-form"
        ? "Fast – achte auf die grammatikalische Form."
        : `Richtige Antwort: ${item.acceptedAnswers[0]}`,
  };
}

export function evaluateDictation(item: DictationItem, userAnswer: string): ListenResult {
  const normalizedAudio = item.audioText
    .toLowerCase()
    .replace(/[.,!?;:\-]/g, "")
    .trim();
  const normalizedUser = userAnswer
    .toLowerCase()
    .replace(/[.,!?;:\-]/g, "")
    .trim();
  const correct = normalizedUser === normalizedAudio;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${item.audioText}`,
  };
}

export function evaluateListenReorder(item: ListenReorderItem, selectedOrder: string[]): ListenResult {
  const correct =
    selectedOrder.length === item.correctOrder.length &&
    selectedOrder.every((w, i) => w === item.correctOrder[i]);
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Reihenfolge: ${item.correctOrder.join(" ")}`,
  };
}

export function evaluateAudioComprehension(
  item: AudioComprehensionItem,
  selectedOptionIndex: number
): ListenResult {
  const correct = selectedOptionIndex === item.correctOptionIndex;
  return {
    correct,
    status: correct ? "correct" : "wrong",
    feedback: correct ? "Richtig!" : `Richtige Antwort: ${item.options[item.correctOptionIndex]}`,
  };
}
