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
});
