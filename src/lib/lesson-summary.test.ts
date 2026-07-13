import { describe, expect, it } from "vitest";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { createLessonAttempt } from "./lesson-attempts";
import { buildLessonPerformanceSummary } from "./lesson-summary";

describe("buildLessonPerformanceSummary", () => {
  it("reports actual score, time, and weak vocabulary", () => {
    const result = makeExerciseResult(["correct", "wrong"], { vocabularyIds: ["v1", "v2"] });
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [result],
      totalDurationMs: 61_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 50,
    });
    const summary = buildLessonPerformanceSummary(attempt);
    expect(summary.score).toBe(50);
    expect(summary.activeMinutes).toBe(1);
    expect(summary.weakVocabularyIds).toEqual(["v2"]);
  });

  it("uses first logical attempts for skills and vocabulary mastery", () => {
    const initialWrong = makeExerciseResult(["wrong"], {
      exerciseId: "exercise-quiz",
      exerciseType: "quiz",
      vocabularyIds: ["v1"],
    });
    const retryCorrect = makeExerciseResult(["correct"], {
      exerciseId: "exercise-quiz",
      exerciseType: "fill-in",
      attemptNumber: 2,
      productive: true,
      vocabularyIds: ["v1"],
    });
    const firstTryCorrect = makeExerciseResult(["correct"], {
      exerciseId: "exercise-writing",
      exerciseType: "fill-in",
      productive: true,
      vocabularyIds: ["v2"],
    });
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [initialWrong, retryCorrect, firstTryCorrect],
      totalDurationMs: 42_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 50,
      requiresProductive: true,
    });

    const summary = buildLessonPerformanceSummary(attempt);

    expect(summary.passed).toBe(true);
    expect(summary.weakVocabularyIds).toEqual(["v1"]);
    expect(summary.masteredVocabularyIds).toEqual(["v2"]);
    expect(summary.strongestSkill).toMatchObject({ exerciseType: "fill-in", accuracy: 1 });
    expect(summary.weakestSkill).toMatchObject({ exerciseType: "quiz", accuracy: 0 });
    expect(summary.recommendedAction).toBe("review-weak-items");
    expect(summary.activeTimeSeconds).toBe(42);
  });

  it("recommends retrying a failed lesson", () => {
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [makeExerciseResult(["wrong"])],
      totalDurationMs: 8_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 70,
    });

    expect(buildLessonPerformanceSummary(attempt).recommendedAction).toBe("retry-lesson");
  });

  it("recommends continuing after a clean mastered attempt", () => {
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [makeExerciseResult(["correct"], { vocabularyIds: ["v1"] })],
      totalDurationMs: 8_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 70,
    });

    const summary = buildLessonPerformanceSummary(attempt);
    expect(attempt.mastered).toBe(true);
    expect(summary.recommendedAction).toBe("continue-course");
    expect(summary.masteredVocabularyIds).toEqual(["v1"]);
  });
});
