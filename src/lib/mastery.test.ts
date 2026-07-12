import { describe, expect, it } from "vitest";
import { buildExerciseResult } from "./evaluation";
import { evaluateMasteryPass, DEFAULT_MASTERY_PASS_CONFIG } from "./mastery";

function wrongResult(itemId: string) {
  return buildExerciseResult({
    exerciseId: "ex1",
    exerciseType: "quiz",
    itemId,
    userAnswer: "wrong",
    acceptedAnswers: ["right"],
    durationMs: 100,
  });
}

function correctResult(itemId: string) {
  return buildExerciseResult({
    exerciseId: "ex1",
    exerciseType: "quiz",
    itemId,
    userAnswer: "right",
    acceptedAnswers: ["right"],
    durationMs: 100,
  });
}

describe("evaluateMasteryPass", () => {
  it("rejects too few items", () => {
    const result = evaluateMasteryPass([correctResult("q1"), correctResult("q2")]);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("Not enough items"))).toBe(true);
  });

  it("rejects all-wrong attempt", () => {
    const results = Array.from({ length: 5 }).map((_, i) => wrongResult(`q${i}`));
    const result = evaluateMasteryPass(results);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("All answers were wrong"))).toBe(true);
  });

  it("rejects accuracy below threshold", () => {
    const results = [
      correctResult("q1"),
      correctResult("q2"),
      wrongResult("q3"),
      wrongResult("q4"),
      wrongResult("q5"),
    ];
    const result = evaluateMasteryPass(results, { ...DEFAULT_MASTERY_PASS_CONFIG, minItems: 1 });
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("Accuracy"))).toBe(true);
  });

  it("passes when accuracy and wrong-form limits are met", () => {
    const results = [
      correctResult("q1"),
      correctResult("q2"),
      correctResult("q3"),
      correctResult("q4"),
      wrongResult("q5"),
    ];
    const result = evaluateMasteryPass(results, { ...DEFAULT_MASTERY_PASS_CONFIG, minItems: 1 });
    expect(result.passed).toBe(true);
  });
});
