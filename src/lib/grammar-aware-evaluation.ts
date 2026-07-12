import { ExerciseResultStatus } from "@/types/learning";
import { normalizeAnswer } from "./answer-evaluation";

export interface GrammarAwareOptions {
  acceptedAnswers: string[];
  /** Bulgarian part of speech, if known. */
  pos?: "noun" | "verb" | "adjective" | "adverb" | "other";
  /** For nouns/adjectives: expected gender of the lemma or required form. */
  expectedGender?: "masculine" | "feminine" | "neuter";
  /** For verbs: expected person/number ending or whole verb form. */
  expectedVerbForm?: string;
  /** Whether the expected answer includes the verb 'съм' (to be). */
  requiresSum?: boolean;
  /** Additional accepted variants explicitly authored by content creators. */
  acceptedVariants?: string[];
  strict?: boolean;
}

// Bulgarian definite article endings by gender.
const DEFINITE_ENDINGS: Record<Exclude<GrammarAwareOptions["expectedGender"], undefined>, string[]> = {
  masculine: ["ът", "а", "ят", "я"],
  feminine: ["та", "ята"],
  neuter: ["то"],
};

function endsWithAny(input: string, endings: string[]): boolean {
  return endings.some((ending) => input.endsWith(ending));
}

function stripDefiniteArticle(input: string, gender?: GrammarAwareOptions["expectedGender"]): string {
  if (!gender) return input;
  const endings = DEFINITE_ENDINGS[gender];
  for (const ending of endings) {
    if (input.endsWith(ending)) {
      return input.slice(0, -ending.length);
    }
  }
  return input;
}

function isMissingSum(user: string, accepted: string[], requiresSum?: boolean): boolean {
  if (!requiresSum) return false;
  // If the accepted answer contains 'съм' and the user answer does not, that's a missing verb.
  return accepted.some((a) => a.includes("съм")) && !user.includes("съм");
}

export function evaluateGrammarAwareAnswer(
  userAnswer: string,
  options: GrammarAwareOptions
): ExerciseResultStatus {
  const opts = { strict: false, acceptedVariants: [], ...options };
  const normalizedUser = normalizeAnswer(userAnswer, {});
  if (normalizedUser.length === 0) return "skipped";

  const allAccepted = [
    ...opts.acceptedAnswers,
    ...opts.acceptedVariants,
  ].map((a) => normalizeAnswer(a, {}));

  if (allAccepted.some((a) => a === normalizedUser)) {
    return "correct";
  }

  if (opts.strict) return "wrong";

  // Missing verb 'съм' detection.
  if (isMissingSum(normalizedUser, allAccepted, opts.requiresSum)) {
    return "wrong-form";
  }

  // Gender/article mismatch detection for nouns/adjectives when expected gender is known.
  if ((opts.pos === "noun" || opts.pos === "adjective") && opts.expectedGender) {
    const userBase = stripDefiniteArticle(normalizedUser, opts.expectedGender);
    const acceptedBase = allAccepted.map((a) => stripDefiniteArticle(a, opts.expectedGender));
    const baseMatches = acceptedBase.some((a) => a === userBase);
    if (baseMatches && !endsWithAny(normalizedUser, DEFINITE_ENDINGS[opts.expectedGender])) {
      // Same lemma but wrong definite/article form.
      return "wrong-form";
    }
  }

  // Verb ending check: if expected form provided, compare last few chars.
  if (opts.pos === "verb" && opts.expectedVerbForm) {
    const expectedNorm = normalizeAnswer(opts.expectedVerbForm, {});
    const endingLength = Math.min(expectedNorm.length, 4);
    const expectedEnding = expectedNorm.slice(-endingLength);
    if (!normalizedUser.endsWith(expectedEnding)) {
      return "wrong-form";
    }
  }

  // Fallback: if the answer is similar to an accepted variant, treat as typo.
  const close = allAccepted.some((a) => levenshteinWithin(a, normalizedUser, 1));
  if (close) return "typo";

  return "wrong";
}

function levenshteinWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
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
      if (matrix[j][i] > max) break;
    }
  }
  return matrix[b.length][a.length] <= max;
}
