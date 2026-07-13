import type { ExerciseResultStatus } from "@/types/learning";
import type { RichStatus } from "./feedback";

export interface AnswerEvaluationOptions {
  /** Primary answers that the exercise is teaching. */
  acceptedAnswers: string[];
  /** Explicitly authored equivalent forms. */
  acceptedVariants?: string[];
  /** Explicitly authored Latin-script answers; transliteration is never inferred. */
  acceptedTransliterations?: string[];
  /** Accept an authored sentence with or without its leading Bulgarian subject pronoun. */
  allowOmittedSubjectPronoun?: boolean;
  /** If true, reject all non-exact answers. */
  strict?: boolean;
  /** Max Levenshtein distance considered a typo (default: 1). */
  typoDistance?: number;
  /** Minimum target length for typo tolerance (default: 4). */
  typoMinLength?: number;
  /** If true, ignore punctuation, brackets, and quotes. */
  ignorePunctuation?: boolean;
  /** If true, compare case-insensitively. */
  ignoreCase?: boolean;
  /** If true, collapse multiple whitespace characters. */
  normalizeWhitespace?: boolean;
  /** Optional grammar metadata for specific wrong-form feedback. */
  pos?: "noun" | "verb" | "adjective" | "adverb" | "other";
  expectedGender?: "masculine" | "feminine" | "neuter";
  expectedVerbForm?: string;
  requiresSum?: boolean;
  /** Optional vocabulary id for analytics. */
  vocabularyId?: string;
}

export type AnswerMatchKind =
  | "primary"
  | "variant"
  | "transliteration"
  | "omitted-pronoun";

export interface DetailedAnswerEvaluation {
  status: ExerciseResultStatus;
  richStatus: RichStatus;
  normalizedUser: string;
  matchedAnswer?: string;
  matchKind?: AnswerMatchKind;
}

export function authoredAnswerOptions(
  primaryAnswer: string,
  authoredAnswers: string[]
): Pick<AnswerEvaluationOptions, "acceptedAnswers" | "acceptedVariants" | "acceptedTransliterations"> {
  const additional = authoredAnswers.filter(
    (answer) => answer.trim() && answer.trim() !== primaryAnswer.trim()
  );
  return {
    acceptedAnswers: [primaryAnswer],
    acceptedVariants: additional.filter((answer) => /[\u0400-\u04FF]/u.test(answer)),
    acceptedTransliterations: additional.filter((answer) => !/[\u0400-\u04FF]/u.test(answer)),
  };
}

const DEFAULT_OPTIONS: Required<
  Pick<
    AnswerEvaluationOptions,
    | "strict"
    | "typoDistance"
    | "typoMinLength"
    | "ignorePunctuation"
    | "ignoreCase"
    | "normalizeWhitespace"
    | "allowOmittedSubjectPronoun"
  >
> = {
  strict: false,
  typoDistance: 1,
  typoMinLength: 4,
  ignorePunctuation: true,
  ignoreCase: true,
  normalizeWhitespace: true,
  allowOmittedSubjectPronoun: false,
};

const SUBJECT_PRONOUNS = new Set(["аз", "ти", "той", "тя", "то", "ние", "вие", "те"]);
const SUM_FORMS = new Set(["съм", "си", "е", "сме", "сте", "са"]);
const DEFINITE_ENDINGS = {
  masculine: ["ът", "а", "ят", "я"],
  feminine: ["та", "ята"],
  neuter: ["то"],
} as const;

function removeDiacritics(input: string): string {
  // Strip combining diacritics from Latin letters while preserving Bulgarian й.
  return input
    .normalize("NFD")
    .replace(/([A-Za-z\u00C0-\u024F])[\u0300-\u036F]/g, "$1")
    .normalize("NFC");
}

export function normalizeAnswer(
  input: string,
  options: Pick<
    AnswerEvaluationOptions,
    "ignorePunctuation" | "ignoreCase" | "normalizeWhitespace"
  >
): string {
  let result = input.normalize("NFC");
  if (options.ignorePunctuation ?? true) {
    result = result
      .replace(/[.,!?;:\-„"'«»()`\[\]]/g, "")
      .replace(/[\u2013\u2014\u2018\u2019\u201C\u201D\u00ab\u00bb]/g, "");
  }
  result = removeDiacritics(result);
  if (options.ignoreCase ?? true) result = result.toLocaleLowerCase("bg");
  if (options.normalizeWhitespace ?? true) result = result.trim().replace(/\s+/g, " ");
  return result;
}

export function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

interface Candidate {
  original: string;
  normalized: string;
  kind: AnswerMatchKind;
}

function candidates(options: AnswerEvaluationOptions): Candidate[] {
  const normalization = { ...DEFAULT_OPTIONS, ...options };
  const authored: Array<{ answer: string; kind: AnswerMatchKind }> = [
    ...options.acceptedAnswers.map((answer) => ({ answer, kind: "primary" as const })),
    ...(options.acceptedVariants ?? []).map((answer) => ({ answer, kind: "variant" as const })),
    ...(options.acceptedTransliterations ?? []).map((answer) => ({
      answer,
      kind: "transliteration" as const,
    })),
  ];
  const all = authored.flatMap(({ answer, kind }) => {
    const normalized = normalizeAnswer(answer, normalization);
    const result: Candidate[] = [{ original: answer, normalized, kind }];
    if (normalization.allowOmittedSubjectPronoun) {
      const words = normalized.split(" ");
      if (words.length > 1 && SUBJECT_PRONOUNS.has(words[0])) {
        result.push({
          original: words.slice(1).join(" "),
          normalized: words.slice(1).join(" "),
          kind: "omitted-pronoun",
        });
      }
    }
    return result;
  });
  const unique = new Map<string, Candidate>();
  for (const candidate of all) {
    if (candidate.normalized && !unique.has(candidate.normalized)) {
      unique.set(candidate.normalized, candidate);
    }
  }
  return [...unique.values()];
}

function isTokenSubsequence(user: string, target: string): boolean {
  const userWords = user.split(" ");
  const targetWords = target.split(" ");
  if (userWords.length >= targetWords.length) return false;
  let targetIndex = 0;
  return userWords.every((word) => {
    while (targetIndex < targetWords.length && targetWords[targetIndex] !== word) {
      targetIndex += 1;
    }
    if (targetIndex >= targetWords.length) return false;
    targetIndex += 1;
    return true;
  });
}

function stripEnding(input: string, endings: readonly string[]): string {
  const ending = endings.find((value) => input.endsWith(value));
  return ending ? input.slice(0, -ending.length) : input;
}

function isSpecificWrongForm(
  user: string,
  target: string,
  options: AnswerEvaluationOptions
): boolean {
  if (options.requiresSum) {
    const targetHasSum = target.split(" ").some((word) => SUM_FORMS.has(word));
    const userHasSum = user.split(" ").some((word) => SUM_FORMS.has(word));
    if (targetHasSum && !userHasSum) return true;
  }

  if ((options.pos === "noun" || options.pos === "adjective") && options.expectedGender) {
    const endings = DEFINITE_ENDINGS[options.expectedGender];
    if (stripEnding(user, endings) === stripEnding(target, endings) && user !== target) return true;
  }

  if (options.pos === "verb" && options.expectedVerbForm) {
    const expected = normalizeAnswer(options.expectedVerbForm, options);
    const stemLength = Math.max(2, Math.min(user.length, expected.length) - 2);
    if (user.slice(0, stemLength) === expected.slice(0, stemLength) && user !== expected) return true;
  }

  const comparableLength = Math.min(user.length, target.length);
  let commonPrefix = 0;
  while (commonPrefix < comparableLength && user[commonPrefix] === target[commonPrefix]) {
    commonPrefix += 1;
  }
  return Math.abs(user.length - target.length) <= 3
    && commonPrefix >= Math.max(3, Math.floor(comparableLength * 0.6));
}

export function evaluateAnswerDetailed(
  userAnswer: string,
  options: AnswerEvaluationOptions
): DetailedAnswerEvaluation {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedUser = normalizeAnswer(userAnswer, opts);
  if (!normalizedUser) {
    return { status: "skipped", richStatus: "missing_word", normalizedUser };
  }

  const accepted = candidates(opts);
  const exact = accepted.find((candidate) => candidate.normalized === normalizedUser);
  if (exact) {
    return {
      status: "correct",
      richStatus: exact.kind === "primary" ? "correct" : "accepted_variant",
      normalizedUser,
      matchedAnswer: exact.original,
      matchKind: exact.kind,
    };
  }

  const closest = accepted
    .map((candidate) => ({ candidate, distance: levenshteinDistance(normalizedUser, candidate.normalized) }))
    .sort((left, right) => left.distance - right.distance)[0];
  if (!closest || opts.strict) {
    return {
      status: "wrong",
      richStatus: "incorrect",
      normalizedUser,
      matchedAnswer: closest?.candidate.original,
    };
  }

  if (
    (opts.pos || opts.expectedGender || opts.expectedVerbForm)
    && accepted.some((candidate) =>
      isSpecificWrongForm(normalizedUser, candidate.normalized, opts)
    )
  ) {
    return {
      status: "wrong-form",
      richStatus: "wrong_form",
      normalizedUser,
      matchedAnswer: closest.candidate.original,
    };
  }

  if (
    closest.candidate.normalized.length >= opts.typoMinLength
    && closest.distance <= opts.typoDistance
  ) {
    return {
      status: "typo",
      richStatus: "correct_with_typo",
      normalizedUser,
      matchedAnswer: closest.candidate.original,
      matchKind: closest.candidate.kind,
    };
  }

  if (accepted.some((candidate) => isTokenSubsequence(normalizedUser, candidate.normalized))) {
    return {
      status: "wrong-form",
      richStatus: "missing_word",
      normalizedUser,
      matchedAnswer: closest.candidate.original,
    };
  }

  if (accepted.some((candidate) => isSpecificWrongForm(normalizedUser, candidate.normalized, opts))) {
    return {
      status: "wrong-form",
      richStatus: "wrong_form",
      normalizedUser,
      matchedAnswer: closest.candidate.original,
    };
  }

  return {
    status: "wrong",
    richStatus: "incorrect",
    normalizedUser,
    matchedAnswer: closest.candidate.original,
  };
}

export function evaluateAnswer(
  userAnswer: string,
  options: AnswerEvaluationOptions
): ExerciseResultStatus {
  return evaluateAnswerDetailed(userAnswer, options).status;
}
