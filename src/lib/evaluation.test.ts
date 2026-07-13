import { describe, expect, it } from "vitest";
import {
  allAnswersWrong,
  buildExerciseResult,
  calculateLessonMetrics,
  evaluateTypedAnswer,
  lessonPassed,
} from "./evaluation";

describe("evaluateTypedAnswer", () => {
  it("returns correct for exact match", () => {
    expect(evaluateTypedAnswer("Здравей", ["Здравей", "Sdrawej"])).toBe("correct");
  });

  it("returns correct for latin exact match", () => {
    expect(evaluateTypedAnswer("Sdrawej", ["Здравей", "Sdrawej"])).toBe("correct");
  });

  it("returns typo for one-letter miss", () => {
    expect(evaluateTypedAnswer("Sdrawe", ["Sdrawej"])).toBe("typo");
  });

  it("returns wrong for unrelated answer", () => {
    expect(evaluateTypedAnswer("Berlin", ["Sdrawej"])).toBe("wrong");
  });

  it("returns skipped for empty answer", () => {
    expect(evaluateTypedAnswer("  ", ["Sdrawej"])).toBe("skipped");
  });

  it("strict mode rejects typo", () => {
    expect(evaluateTypedAnswer("Sdrawe", ["Sdrawej"], { strict: true })).toBe("wrong");
  });

  it("ignores punctuation and case", () => {
    expect(evaluateTypedAnswer("sdrawej!", ["Sdrawej"])).toBe("correct");
  });
});

describe("buildExerciseResult", () => {
  it("marks correct answers as passing", () => {
    const result = buildExerciseResult({
      exerciseId: "ex1",
      exerciseType: "fill-in",
      itemId: "f1",
      userAnswer: "Здравей",
      acceptedAnswers: ["Здравей"],
      durationMs: 1000,
    });
    expect(result.isPassing).toBe(true);
    expect(result.status).toBe("correct");
  });

  it("marks wrong answers as non-passing", () => {
    const result = buildExerciseResult({
      exerciseId: "ex1",
      exerciseType: "fill-in",
      itemId: "f1",
      userAnswer: "Berlin",
      acceptedAnswers: ["Здравей"],
      durationMs: 1000,
    });
    expect(result.isPassing).toBe(false);
    expect(result.status).toBe("wrong");
  });
});

describe("calculateLessonMetrics", () => {
  it("all-wrong attempt has zero accuracy and zero score", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong1",
        acceptedAnswers: ["right"],
        durationMs: 500,
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "wrong2",
        acceptedAnswers: ["right"],
        durationMs: 500,
      }),
    ];
    const metrics = calculateLessonMetrics(results);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.score).toBe(0);
    expect(metrics.firstTryCorrect).toBe(0);
  });

  it("all-correct attempt has full accuracy", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 500,
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 500,
      }),
    ];
    const metrics = calculateLessonMetrics(results);
    expect(metrics.accuracy).toBe(1);
    expect(metrics.score).toBe(100);
  });
});

describe("lessonPassed", () => {
  it("rejects an all-wrong attempt", () => {
    const results = Array.from({ length: 5 }).map((_, i) =>
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: `q${i}`,
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
      })
    );
    expect(lessonPassed(results)).toBe(false);
    expect(allAnswersWrong(results)).toBe(true);
  });

  it("accepts a passing accuracy", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q3",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
    ];
    expect(lessonPassed(results, 0.6, 1)).toBe(true);
  });
});
