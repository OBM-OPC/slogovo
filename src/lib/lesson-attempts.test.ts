import { describe, expect, it } from "vitest";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { createLessonAttempt } from "./lesson-attempts";

function attempt(results = [makeExerciseResult(["correct"])], completed = true, requiredScore = 80) {
  return createLessonAttempt({
    id: "00000000-0000-4000-8000-000000000001",
    userId: "u1",
    lessonId: "l1",
    moduleId: "m1",
    level: "A1",
    results,
    totalDurationMs: 42_000,
    startedAt: "2026-07-13T10:00:00.000Z",
    finishedAt: "2026-07-13T10:00:42.000Z",
    completed,
    requiredScore,
  });
}

describe("createLessonAttempt", () => {
  it("preserves actual duration and passes a calculated result", () => {
    const result = attempt();
    expect(result.passed).toBe(true);
    expect(result.activeTimeSeconds).toBe(42);
    expect(result.totalDurationMs).not.toBe(15 * 60_000);
  });

  it("does not pass merely because the final screen was reached", () => {
    const result = attempt([makeExerciseResult(["wrong"])], true);
    expect(result.completed).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.mastered).toBe(false);
  });

  it("does not pass before screens are complete even with correct answers", () => {
    expect(attempt([makeExerciseResult(["correct"])], false).passed).toBe(false);
  });
});
