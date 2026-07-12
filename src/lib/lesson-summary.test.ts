import { describe, expect, it } from "vitest";
import { buildLessonPerformanceSummary } from "./lesson-summary";
import { createLessonAttempt } from "./lesson-attempts";
import { buildExerciseResult } from "./evaluation";

describe("buildLessonPerformanceSummary", () => {
  it("summarizes a passing attempt with real metrics", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 1000,
        vocabularyId: "v1",
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 1000,
        vocabularyId: "v2",
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q3",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 1000,
        vocabularyId: "v3",
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q4",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 1000,
        vocabularyId: "v4",
      }),
    ];
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results,
      totalDurationMs: 180000,
      startedAt: new Date().toISOString(),
      completed: true,
    });
    const summary = buildLessonPerformanceSummary(attempt);
    expect(summary.passed).toBe(true);
    expect(summary.accuracy).toBeCloseTo(0.75, 2);
    expect(summary.activeMinutes).toBe(3);
    expect(summary.weakVocabularyIds).toContain("v4");
    expect(summary.strongVocabularyIds).toContain("v1");
    expect(summary.strongVocabularyIds).toContain("v2");
    expect(summary.strongVocabularyIds).toContain("v3");
  });

  it("summarizes a failing all-wrong attempt", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 500,
        vocabularyId: "v1",
      }),
    ];
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results,
      totalDurationMs: 30000,
      startedAt: new Date().toISOString(),
      completed: true,
    });
    const summary = buildLessonPerformanceSummary(attempt);
    expect(summary.passed).toBe(false);
    expect(summary.accuracy).toBe(0);
    expect(summary.xpEarned).toBe(0);
    expect(summary.weakVocabularyIds).toContain("v1");
  });
});
