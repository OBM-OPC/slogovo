import type { ExerciseResultStatus } from "@/types/learning";
import { evaluateAnswer } from "./answer-evaluation";

export interface GrammarAwareOptions {
  acceptedAnswers: string[];
  pos?: "noun" | "verb" | "adjective" | "adverb" | "other";
  expectedGender?: "masculine" | "feminine" | "neuter";
  expectedVerbForm?: string;
  requiresSum?: boolean;
  acceptedVariants?: string[];
  acceptedTransliterations?: string[];
  allowOmittedSubjectPronoun?: boolean;
  strict?: boolean;
}

/** Compatibility wrapper; all answer checking is authoritative in answer-evaluation.ts. */
export function evaluateGrammarAwareAnswer(
  userAnswer: string,
  options: GrammarAwareOptions
): ExerciseResultStatus {
  return evaluateAnswer(userAnswer, {
    ...options,
    typoDistance: 2,
  });
}
