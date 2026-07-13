import { ExerciseResultStatus } from "@/types/learning";

export interface AnswerEvaluationOptions {
  /** Accepted exact answers. */
  acceptedAnswers: string[];
  /** If true, reject all answers that are not exact matches. */
  strict?: boolean;
  /** Max Levenshtein distance considered a typo (default: 1). */
  typoDistance?: number;
  /** Minimum length for typo tolerance to apply (default: 4). */
  typoMinLength?: number;
  /** If true, ignore punctuation, brackets, and quotes. */
  ignorePunctuation?: boolean;
  /** If true, compare case-insensitively. */
  ignoreCase?: boolean;
  /** If true, collapse multiple whitespace characters. */
  normalizeWhitespace?: boolean;
  /** Optional vocabulary id for analytics. */
  vocabularyId?: string;
}

const DEFAULT_OPTIONS: Required<Omit<AnswerEvaluationOptions, "acceptedAnswers" | "vocabularyId">>
  = {
    strict: false,
    typoDistance: 1,
    typoMinLength: 4,
    ignorePunctuation: true,
    ignoreCase: true,
    normalizeWhitespace: true,
  };

function removeDiacritics(input: string): string {
  // Strip combining diacritics that follow Latin base letters; preserve Cyrillic й etc.
  return input
    .normalize("NFD")
    .replace(/([A-Za-z\u00C0-\u024F])[\u0300-\u036F]/g, "$1")
    .normalize("NFC");
}

export function normalizeAnswer(
  input: string,
  options: Pick<AnswerEvaluationOptions, "ignorePunctuation" | "ignoreCase" | "normalizeWhitespace">
): string {
  let result = input;
  if (options.ignorePunctuation ?? true) {
    result = result
      .replace(/[.,!?;:\-„""''«»()`\[\]]/g, "")
      .replace(/[\u2013\u2014]/g, "")
      .replace(/[\u00ab\u00bb]/g, "");
  }
  result = removeDiacritics(result);
  if (options.ignoreCase ?? true) {
    result = result.toLowerCase();
  }
  if (options.normalizeWhitespace ?? true) {
    result = result.trim().replace(/\s+/g, " ");
  }
  return result;
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

function isTypoOf(user: string, target: string, maxDistance: number, minLength: number): boolean {
  if (user === target) return false;
  if (target.length < minLength) return false;
  return levenshtein(user, target) <= maxDistance;
}

function wrongFormHeuristic(user: string, targets: string[]): boolean {
  // Placeholder for Bulgarian grammar-aware wrong-form detection (#48).
  // Currently flags answers that share >= 50% of characters and length within 2.
  return targets.some((target) => {
    const common = [...user].filter((c, i) => target[i] === c).length;
    const lengthDiff = Math.abs(target.length - user.length);
    return lengthDiff <= 2 && common >= Math.min(target.length, user.length) / 2;
  });
}

export function evaluateAnswer(
  userAnswer: string,
  options: AnswerEvaluationOptions
): ExerciseResultStatus {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedUser = normalizeAnswer(userAnswer, opts);
  if (normalizedUser.length === 0) return "skipped";

  const normalizedTargets = opts.acceptedAnswers
    .map((a) => normalizeAnswer(a, opts))
    .filter((a) => a.length > 0);

  if (normalizedTargets.some((t) => t === normalizedUser)) {
    return "correct";
  }

  if (opts.strict) return "wrong";

  if (wrongFormHeuristic(normalizedUser, normalizedTargets)) {
    if (normalizedTargets.some((t) =>
      isTypoOf(normalizedUser, t, opts.typoDistance, opts.typoMinLength)
    )) {
      return "typo";
    }
    return "wrong-form";
  }

  if (normalizedTargets.some((t) =>
    isTypoOf(normalizedUser, t, opts.typoDistance, opts.typoMinLength)
  )) {
    return "typo";
  }

  return "wrong";
}
