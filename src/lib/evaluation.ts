import {
  ExerciseResult,
  ExerciseResultStatus,
  ExerciseType,
} from "@/types/learning";
import { DEFAULT_MASTERY_PASS_CONFIG, evaluateMasteryPass } from "./mastery";

function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,!?;:\-]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function isTypoOf(user: string, target: string): boolean {
  // Levenshtein distance of 1 allowed for length >= 4, no typo allowance for very short words.
  if (user === target) return false; // not a typo, it's exact
  if (target.length <= 3) return false;
  const distance = levenshtein(user, target);
  return distance === 1;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

export function evaluateTypedAnswer(
  userAnswer: string,
  acceptedAnswers: string[],
  options: {
    strict?: boolean;
    feedback?: string;
    feedbackNeedsReview?: boolean;
    vocabularyId?: string;
  } = {}
): ExerciseResultStatus {
  const normalizedUser = normalizeAnswer(userAnswer);
  if (normalizedUser.length === 0) return "skipped";

  const normalizedTargets = acceptedAnswers.map(normalizeAnswer).filter((a) => a.length > 0);
  if (normalizedTargets.some((t) => t === normalizedUser)) {
    return "correct";
  }

  // Strict mode rejects typo tolerance.
  if (options.strict) {
    return "wrong";
  }

  // Bulgarian wrong-form detection: if answer shares significant letters but is clearly a
  // morphological variant, mark as wrong-form. This is a heuristic placeholder; real
  // grammar-aware checking comes in #48.
  const wrongFormCandidate = normalizedTargets.some((t) => {
    const common = [...normalizedUser].filter((c, i) => t[i] === c).length;
    return Math.abs(t.length - normalizedUser.length) <= 2 && common >= Math.min(t.length, normalizedUser.length) / 2;
  });
  if (wrongFormCandidate && normalizedTargets.some((t) => isTypoOf(normalizedUser, t))) {
    return "typo";
  }
  if (wrongFormCandidate) {
    return "wrong-form";
  }

  if (normalizedTargets.some((t) => isTypoOf(normalizedUser, t))) {
    return "typo";
  }

  return "wrong";
}

export function buildExerciseResult(params: {
  exerciseId: string;
  exerciseType: ExerciseType;
  itemId: string;
  userAnswer: string;
  acceptedAnswers: string[];
  durationMs: number;
  strict?: boolean;
  feedback?: string;
  feedbackNeedsReview?: boolean;
  vocabularyId?: string;
}): ExerciseResult {
  const status = evaluateTypedAnswer(params.userAnswer, params.acceptedAnswers, {
    strict: params.strict,
    feedback: params.feedback,
    feedbackNeedsReview: params.feedbackNeedsReview,
    vocabularyId: params.vocabularyId,
  });
  return {
    exerciseId: params.exerciseId,
    exerciseType: params.exerciseType,
    itemId: params.itemId,
    status,
    isPassing: status === "correct" || status === "typo",
    userAnswer: params.userAnswer,
    correctAnswers: params.acceptedAnswers,
    feedback: params.feedback,
    feedbackNeedsReview: params.feedbackNeedsReview,
    durationMs: Math.max(0, params.durationMs),
    answeredAt: new Date().toISOString(),
    vocabularyId: params.vocabularyId,
  };
}

export function calculateLessonMetrics(results: ExerciseResult[]): {
  accuracy: number;
  score: number;
  firstTryCorrect: number;
  itemsAnswered: number;
} {
  const itemsAnswered = results.length;
  const firstTryCorrect = results.filter((r) => r.status === "correct" || r.status === "typo").length;
  const accuracy = itemsAnswered === 0 ? 0 : firstTryCorrect / itemsAnswered;

  // Score weights: correct = 1, typo = 0.75, wrong-form = 0.25, wrong/skipped = 0
  const weights: Record<ExerciseResultStatus, number> = {
    correct: 1,
    typo: 0.75,
    "wrong-form": 0.25,
    wrong: 0,
    skipped: 0,
  };
  const rawScore = itemsAnswered === 0 ? 0 : results.reduce((sum, r) => sum + weights[r.status], 0) / itemsAnswered;
  const score = Math.round(rawScore * 100);

  return { accuracy, score, firstTryCorrect, itemsAnswered };
}

export function lessonPassed(
  results: ExerciseResult[],
  minAccuracy = DEFAULT_MASTERY_PASS_CONFIG.minAccuracy,
  minItems = DEFAULT_MASTERY_PASS_CONFIG.minItems
): boolean {
  const { passed } = evaluateMasteryPass(results, {
    ...DEFAULT_MASTERY_PASS_CONFIG,
    minAccuracy,
    minItems,
  });
  return passed;
}

export function allAnswersWrong(results: ExerciseResult[]): boolean {
  return results.length > 0 && results.every((r) => r.status === "wrong" || r.status === "skipped");
}
