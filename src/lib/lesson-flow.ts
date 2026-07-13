import {
  Exercise,
  ExerciseResult,
  FillInSentence,
  ListenExerciseItem,
  MatchingPair,
  QuizQuestion,
  SentenceBuilder,
} from "@/types";
import { FlattenedExerciseItemResult, flattenExerciseResults } from "./evaluation";

export interface ExerciseRun {
  exercise: Exercise;
  attemptNumber: number;
  retry: boolean;
}

export function createInitialExerciseRuns(exercises: Exercise[]): ExerciseRun[] {
  return exercises.map((exercise) => ({ exercise, attemptNumber: 1, retry: false }));
}

type ExerciseDataItem = { id: string };

function uniqueAnswers(result: FlattenedExerciseItemResult): string[] {
  return [...new Set(result.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean))];
}

function retryPrompt(exercise: Exercise, item: ExerciseDataItem): string {
  switch (exercise.type) {
    case "quiz":
      return (item as QuizQuestion).question;
    case "matching":
      return (item as MatchingPair).de;
    case "fill-in": {
      const sentence = item as FillInSentence;
      return sentence.de ?? sentence.parts.join(" ").replace("____", "…");
    }
    case "sentence-builder": {
      const sentence = item as SentenceBuilder;
      return sentence.de ?? sentence.bg ?? "Welcher Satz ist korrekt?";
    }
    case "listen":
      return "Welche Antwort war bei der Hörübung korrekt?";
    default:
      return "Welche Antwort ist korrekt?";
  }
}

function listenAnswerLabel(item: ListenExerciseItem, answer: string): string {
  if (item.format !== "listen-select") return answer;
  const option = item.options.find((candidate) => candidate.id === answer);
  return option?.bg ?? option?.de ?? answer;
}

function answerLabel(exercise: Exercise, item: ExerciseDataItem, answer: string): string {
  if (exercise.type === "listen") {
    return listenAnswerLabel(item as ListenExerciseItem, answer);
  }
  return answer;
}

function stableCorrectIndex(itemId: string): 0 | 1 {
  const sum = [...itemId].reduce((total, character) => total + character.charCodeAt(0), 0);
  return sum % 2 === 0 ? 0 : 1;
}

function createFillInRetry(
  exercise: Exercise,
  source: ExerciseDataItem,
  result: FlattenedExerciseItemResult,
  answers: string[]
): Exercise {
  const sentence: FillInSentence = {
    id: result.itemId,
    parts: ["", "____"],
    answer: answers[0],
    answers,
    de: retryPrompt(exercise, source),
    explanation: result.feedback,
    required: result.required,
  };
  return {
    id: exercise.id,
    type: "fill-in",
    title: `${exercise.title} · Fehlertraining`,
    data: [sentence],
  };
}

function createQuizRetry(
  exercise: Exercise,
  source: ExerciseDataItem,
  result: FlattenedExerciseItemResult,
  answers: string[]
): Exercise {
  const correct = answerLabel(exercise, source, answers[0]);
  const submitted = answerLabel(exercise, source, result.userAnswer?.trim() ?? "");
  const distractor = submitted && submitted !== correct ? submitted : "Andere Antwort";
  const correctOptionIndex = stableCorrectIndex(result.itemId);
  const options = correctOptionIndex === 0 ? [correct, distractor] : [distractor, correct];
  const question: QuizQuestion = {
    id: result.itemId,
    question: retryPrompt(exercise, source),
    options,
    correctOptionIndex,
    explanation: result.feedback,
    required: result.required,
  };
  return {
    id: exercise.id,
    type: "quiz",
    title: `${exercise.title} · Fehlertraining`,
    data: [question],
  };
}

function createAlternativeRetryExercise(
  exercise: Exercise,
  result: FlattenedExerciseItemResult
): Exercise | null {
  const source = (exercise.data as ExerciseDataItem[]).find((item) => item.id === result.itemId);
  const answers = uniqueAnswers(result);
  if (!source || answers.length === 0) return null;

  if (exercise.type === "quiz" || exercise.type === "matching") {
    return createFillInRetry(exercise, source, result, answers);
  }
  if (exercise.type === "fill-in" || exercise.type === "sentence-builder" || exercise.type === "listen") {
    return createQuizRetry(exercise, source, result, answers);
  }
  return null;
}

export function createRetryRuns(
  exercise: Exercise,
  result: ExerciseResult,
  maxAttemptNumber = 3
): ExerciseRun[] {
  const byItem = new Map<string, ReturnType<typeof flattenExerciseResults>>();
  for (const item of flattenExerciseResults([result])) {
    const existing = byItem.get(item.itemId) ?? [];
    existing.push(item);
    byItem.set(item.itemId, existing);
  }

  const failed = [...byItem.values()]
    .map((attempts) => attempts.filter((item) => item.required && !item.isPassing))
    .filter((attempts) => attempts.length > 0)
    .map((attempts) => attempts.reduce((latest, item) => item.attemptNumber >= latest.attemptNumber ? item : latest))
    .filter((item) => item.attemptNumber < maxAttemptNumber);

  return failed.flatMap((item) => {
    const retryExercise = createAlternativeRetryExercise(exercise, item);
    if (!retryExercise) return [];
    return [{
      exercise: retryExercise,
      attemptNumber: item.attemptNumber + 1,
      retry: true,
    }];
  });
}

export function reachedFinalScreen(initialExerciseCount: number, completedInitialRuns: number): boolean {
  return initialExerciseCount > 0 && completedInitialRuns >= initialExerciseCount;
}
