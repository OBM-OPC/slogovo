import { describe, expect, it } from "vitest";
import { buildExerciseResult } from "./evaluation";
import { evaluateLessonGate, isLessonMastered } from "./lesson-gate";

describe("evaluateLessonGate", () => {
  it("passes with enough correct answers", () => {
    const results = [
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q1", userAnswer: "r", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q2", userAnswer: "r", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q3", userAnswer: "r", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q4", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
    ];
    const gate = evaluateLessonGate(results);
    expect(gate.passed).toBe(true);
    expect(gate.retryRecommended).toBe(false);
  });

  it("fails an all-wrong attempt and recommends retry", () => {
    const results = [
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q1", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q2", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q3", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
    ];
    const gate = evaluateLessonGate(results);
    expect(gate.passed).toBe(false);
    expect(gate.retryRecommended).toBe(true);
  });

  it("recommends retry below 70% accuracy", () => {
    const results = [
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q1", userAnswer: "r", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q2", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q3", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
      buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemId: "q4", userAnswer: "w", acceptedAnswers: ["r"], durationMs: 100 }),
    ];
    const gate = evaluateLessonGate(results);
    expect(gate.passed).toBe(false);
    expect(gate.retryRecommended).toBe(true);
    expect(gate.accuracy).toBeCloseTo(0.25);
  });
});

describe("isLessonMastered", () => {
  it("requires both accuracy and score thresholds", () => {
    expect(isLessonMastered(0.7, 80)).toBe(true);
    expect(isLessonMastered(0.69, 80)).toBe(false);
    expect(isLessonMastered(0.7, 79)).toBe(false);
  });
});
