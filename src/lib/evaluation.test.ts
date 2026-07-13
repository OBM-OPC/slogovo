import { describe, expect, it } from "vitest";
import { makeExerciseResult } from "@/test/learning-fixtures";
import {
  allAnswersWrong,
  buildExerciseItemResult,
  buildExerciseResult,
  calculateLessonMetrics,
  evaluateLessonOutcome,
  evaluateTypedAnswer,
} from "./evaluation";

describe("evaluateTypedAnswer", () => {
  it("normalizes exact answers and recognizes typos", () => {
    expect(evaluateTypedAnswer("Здравей!", ["здравей"])).toBe("correct");
    expect(evaluateTypedAnswer("Sdrawe", ["Sdrawej"])).toBe("typo");
    expect(evaluateTypedAnswer("Berlin", ["Sdrawej"])).toBe("wrong");
  });
});

describe("authoritative exercise result", () => {
  it("contains aggregate counts, attempts, nested item results, hints, and timestamps", () => {
    const startedAt = "2026-07-13T10:00:00.000Z";
    const item = buildExerciseItemResult({
      itemId: "q1",
      userAnswer: "right",
      acceptedAnswers: ["right"],
      durationMs: 1000,
      startedAt,
      hintsUsed: 1,
    });
    const result = buildExerciseResult({ exerciseId: "ex1", exerciseType: "quiz", itemResults: [item], startedAt });
    expect(result).toMatchObject({
      exerciseId: "ex1",
      exerciseType: "quiz",
      correctAnswers: 1,
      incorrectAnswers: 0,
      attempts: 1,
      hintsUsed: 1,
      startedAt,
    });
    expect(result.itemResults).toHaveLength(1);
    expect(result.completedAt).toBeTruthy();
  });
});

describe("lesson outcome", () => {
  it("fails an all-wrong lesson and never masters it", () => {
    const results = [makeExerciseResult(["wrong", "wrong", "wrong"])];
    const outcome = evaluateLessonOutcome(results, { completed: true, requiredScore: 80 });
    expect(outcome.passed).toBe(false);
    expect(outcome.mastered).toBe(false);
    expect(allAnswersWrong(results)).toBe(true);
  });

  it("fails below requiredScore", () => {
    const outcome = evaluateLessonOutcome(
      [makeExerciseResult(["correct", "correct", "correct", "wrong"])],
      { completed: true, requiredScore: 80 }
    );
    expect(outcome.score).toBe(75);
    expect(outcome.passed).toBe(false);
  });

  it("passes at requiredScore after every required item is correct at least once", () => {
    const initial = makeExerciseResult(["correct", "correct", "correct", "wrong"]);
    const retry = makeExerciseResult(["correct"], { attemptNumber: 2 });
    retry.itemResults[0].itemId = "item-4";
    const outcome = evaluateLessonOutcome([initial, retry], { completed: true, requiredScore: 75 });
    expect(outcome.passed).toBe(true);
    expect(outcome.accuracy).toBe(0.75);
  });

  it("requires a configured productive exercise", () => {
    const recognition = makeExerciseResult(["correct"], { productive: false });
    expect(evaluateLessonOutcome([recognition], {
      completed: true,
      requiredScore: 70,
      requiresProductive: true,
    }).passed).toBe(false);
  });

  it("calculates partial results from first attempts rather than completed blocks", () => {
    const metrics = calculateLessonMetrics([makeExerciseResult(["correct", "wrong", "correct"])]);
    expect(metrics.firstTryCorrect).toBe(2);
    expect(metrics.itemsAnswered).toBe(3);
    expect(metrics.accuracy).toBeCloseTo(2 / 3);
    expect(metrics.score).toBe(67);
  });
});
