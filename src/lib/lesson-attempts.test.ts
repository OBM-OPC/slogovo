import { describe, expect, it } from "vitest";
import { createLessonAttempt } from "./lesson-attempts";
import { buildExerciseResult } from "./evaluation";

describe("createLessonAttempt", () => {
  it("creates a passing attempt for all-correct answers", () => {
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
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
    ];
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results,
      totalDurationMs: 300,
      startedAt: new Date().toISOString(),
      completed: true,
    });
    expect(attempt.passed).toBe(true);
    expect(attempt.accuracy).toBe(1);
    expect(attempt.score).toBe(100);
    expect(attempt.xpEarned).toBeGreaterThan(0);
  });

  it("creates a failing attempt for all-wrong answers", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
    ];
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results,
      totalDurationMs: 200,
      startedAt: new Date().toISOString(),
      completed: true,
    });
    expect(attempt.passed).toBe(false);
    expect(attempt.accuracy).toBe(0);
    expect(attempt.score).toBe(0);
    expect(attempt.xpEarned).toBe(0);
  });

  it("fails an attempt that is not completed", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 100,
      }),
    ];
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results,
      totalDurationMs: 100,
      startedAt: new Date().toISOString(),
      completed: false,
    });
    expect(attempt.passed).toBe(false);
  });
});
