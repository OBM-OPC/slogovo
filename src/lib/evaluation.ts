import {
  ExerciseItemResult,
  ExerciseResult,
  ExerciseResultStatus,
  ExerciseType,
  RequiredExerciseGroup,
} from "@/types/learning";
import { evaluateAnswer } from "./answer-evaluation";

export function evaluateTypedAnswer(
  userAnswer: string,
  acceptedAnswers: string[],
  options: { strict?: boolean } = {}
): ExerciseResultStatus {
  return evaluateAnswer(userAnswer, {
    acceptedAnswers,
    strict: options.strict,
  });
}

export function buildExerciseItemResult(params: {
  itemId: string;
  userAnswer?: string;
  acceptedAnswers: string[];
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  attemptNumber?: number;
  hintsUsed?: number;
  required?: boolean;
  productive?: boolean;
  strict?: boolean;
  status?: ExerciseResultStatus;
  feedback?: string;
  feedbackNeedsReview?: boolean;
  vocabularyId?: string;
}): ExerciseItemResult {
  const status = params.status ?? evaluateTypedAnswer(
    params.userAnswer ?? "",
    params.acceptedAnswers,
    { strict: params.strict }
  );
  const completedAt = params.completedAt ?? new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    itemId: params.itemId,
    status,
    isPassing: status === "correct" || status === "typo",
    userAnswer: params.userAnswer,
    acceptedAnswers: params.acceptedAnswers,
    feedback: params.feedback,
    feedbackNeedsReview: params.feedbackNeedsReview,
    durationMs: Math.max(0, params.durationMs),
    startedAt: params.startedAt,
    completedAt,
    attemptNumber: Math.max(1, params.attemptNumber ?? 1),
    hintsUsed: Math.max(0, params.hintsUsed ?? 0),
    required: params.required ?? true,
    productive: params.productive ?? false,
    vocabularyId: params.vocabularyId,
  };
}

export function buildExerciseResult(params: {
  exerciseId: string;
  exerciseType: ExerciseType;
  itemResults: ExerciseItemResult[];
  startedAt: string;
  completedAt?: string;
}): ExerciseResult {
  const completedAt = params.completedAt ?? new Date().toISOString();
  const correctAnswers = params.itemResults.filter((result) => result.isPassing).length;
  const incorrectAnswers = params.itemResults.length - correctAnswers;
  return {
    exerciseId: params.exerciseId,
    exerciseType: params.exerciseType,
    correctAnswers,
    incorrectAnswers,
    attempts: params.itemResults.length,
    itemResults: params.itemResults,
    hintsUsed: params.itemResults.reduce((sum, result) => sum + result.hintsUsed, 0),
    startedAt: params.startedAt,
    completedAt,
  };
}

export interface FlattenedExerciseItemResult extends ExerciseItemResult {
  exerciseId: string;
  exerciseType: ExerciseType;
}

export function flattenExerciseResults(results: ExerciseResult[]): FlattenedExerciseItemResult[] {
  return results.flatMap((exercise) =>
    exercise.itemResults.map((item) => ({
      ...item,
      exerciseId: exercise.exerciseId,
      exerciseType: exercise.exerciseType,
    }))
  );
}

function itemKey(result: FlattenedExerciseItemResult): string {
  return `${result.exerciseId}:${result.itemId}`;
}

export function firstItemAttempts(results: ExerciseResult[]): FlattenedExerciseItemResult[] {
  const first = new Map<string, FlattenedExerciseItemResult>();
  for (const result of flattenExerciseResults(results)) {
    const key = itemKey(result);
    const existing = first.get(key);
    if (!existing || result.attemptNumber < existing.attemptNumber) {
      first.set(key, result);
    }
  }
  return [...first.values()];
}

const SCORE_WEIGHTS: Record<ExerciseResultStatus, number> = {
  correct: 1,
  typo: 0.75,
  "wrong-form": 0.25,
  wrong: 0,
  skipped: 0,
};

export function calculateLessonMetrics(results: ExerciseResult[]): {
  accuracy: number;
  score: number;
  firstTryCorrect: number;
  itemsAnswered: number;
  correctCount: number;
  incorrectCount: number;
} {
  const firstAttempts = firstItemAttempts(results);
  const allAttempts = flattenExerciseResults(results);
  const itemsAnswered = firstAttempts.length;
  const firstTryCorrect = firstAttempts.filter((result) => result.isPassing).length;
  const accuracy = itemsAnswered === 0 ? 0 : firstTryCorrect / itemsAnswered;
  const weighted = firstAttempts.reduce((sum, result) => sum + SCORE_WEIGHTS[result.status], 0);
  const score = itemsAnswered === 0 ? 0 : Math.round((weighted / itemsAnswered) * 100);
  const correctCount = allAttempts.filter((result) => result.isPassing).length;

  return {
    accuracy,
    score,
    firstTryCorrect,
    itemsAnswered,
    correctCount,
    incorrectCount: allAttempts.length - correctCount,
  };
}

export interface LessonOutcomeOptions {
  requiredScore: number;
  completed: boolean;
  requiresProductive?: boolean;
  requiredExerciseGroups?: RequiredExerciseGroup[];
  masteryScore?: number;
}

export interface LessonOutcome {
  passed: boolean;
  mastered: boolean;
  reasons: string[];
  missingRequiredItems: string[];
  missingRequiredGroups: string[];
  accuracy: number;
  score: number;
}

function passedExerciseIds(results: ExerciseResult[]): Set<string> {
  const flattened = flattenExerciseResults(results);
  const requiredKeysByExercise = new Map<string, Set<string>>();
  const passedKeysByExercise = new Map<string, Set<string>>();

  for (const result of flattened) {
    if (!result.required) continue;
    const key = itemKey(result);
    const requiredKeys = requiredKeysByExercise.get(result.exerciseId) ?? new Set<string>();
    requiredKeys.add(key);
    requiredKeysByExercise.set(result.exerciseId, requiredKeys);
    if (result.isPassing) {
      const passedKeys = passedKeysByExercise.get(result.exerciseId) ?? new Set<string>();
      passedKeys.add(key);
      passedKeysByExercise.set(result.exerciseId, passedKeys);
    }
  }

  const passed = new Set<string>();
  for (const [exerciseId, requiredKeys] of requiredKeysByExercise.entries()) {
    const passedKeys = passedKeysByExercise.get(exerciseId) ?? new Set<string>();
    if (requiredKeys.size > 0 && [...requiredKeys].every((key) => passedKeys.has(key))) {
      passed.add(exerciseId);
    }
  }
  return passed;
}

function missingExerciseGroups(
  results: ExerciseResult[],
  groups: RequiredExerciseGroup[] = []
): string[] {
  const passed = passedExerciseIds(results);
  return groups.flatMap((group, index) => {
    const groupId = typeof group.id === "string" && group.id.trim()
      ? group.id.trim()
      : `group-${index + 1}`;
    const exerciseIds = Array.isArray(group.exerciseIds)
      ? [...new Set(group.exerciseIds)]
      : [];
    const minimumPassed = group.minimumPassed ?? 1;
    const invalid = !Number.isInteger(minimumPassed)
      || minimumPassed < 1
      || minimumPassed > exerciseIds.length;
    if (invalid) return [groupId];
    const passedCount = exerciseIds.filter((exerciseId) => passed.has(exerciseId)).length;
    return passedCount >= minimumPassed ? [] : [groupId];
  });
}

export function evaluateLessonOutcome(
  results: ExerciseResult[],
  options: LessonOutcomeOptions
): LessonOutcome {
  const metrics = calculateLessonMetrics(results);
  const flattened = flattenExerciseResults(results);
  const required = flattened.filter((result) => result.required);
  const requiredKeys = new Set(required.map(itemKey));
  const passedRequiredKeys = new Set(required.filter((result) => result.isPassing).map(itemKey));
  const missingRequiredItems = [...requiredKeys].filter((key) => !passedRequiredKeys.has(key));
  const firstAttempts = firstItemAttempts(results);
  const allWrong = firstAttempts.length > 0 && firstAttempts.every((result) => !result.isPassing);
  const productiveSatisfied = !options.requiresProductive || flattened.some(
    (result) => result.productive && result.isPassing
  );
  const missingRequiredGroups = missingExerciseGroups(results, options.requiredExerciseGroups);
  const reasons: string[] = [];

  if (!options.completed) reasons.push("Lesson screens were not completed.");
  if (firstAttempts.length === 0) reasons.push("No required exercise items were answered.");
  if (allWrong) reasons.push("All first attempts were incorrect.");
  if (metrics.score < options.requiredScore) {
    reasons.push(`Score ${metrics.score} is below required score ${options.requiredScore}.`);
  }
  if (missingRequiredItems.length > 0) {
    reasons.push(`${missingRequiredItems.length} required item(s) were never answered correctly.`);
  }
  if (!productiveSatisfied) reasons.push("A required productive exercise was not passed.");
  if (missingRequiredGroups.length > 0) {
    reasons.push(`${missingRequiredGroups.length} required exercise group(s) were not passed.`);
  }

  const passed = reasons.length === 0;
  const masteryScore = Math.max(options.requiredScore, options.masteryScore ?? 90);
  const mastered = passed && metrics.score >= masteryScore && metrics.accuracy >= 0.9;

  return {
    passed,
    mastered,
    reasons,
    missingRequiredItems,
    missingRequiredGroups,
    accuracy: metrics.accuracy,
    score: metrics.score,
  };
}

export function allAnswersWrong(results: ExerciseResult[]): boolean {
  const firstAttempts = firstItemAttempts(results);
  return firstAttempts.length > 0 && firstAttempts.every((result) => !result.isPassing);
}
