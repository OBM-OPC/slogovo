import { describe, expect, it } from "vitest";
import { defaultProgress, progressToRow, rowToProgress } from "./progress-serialization";

describe("progress serialization", () => {
  it("preserves camel-case API progress instead of resetting remote state", () => {
    const progress = {
      ...defaultProgress("u1"),
      completedLessons: ["lesson-1"],
      masteredLessons: ["lesson-1"],
      lessonScores: { "lesson-1": 94 },
      recordedAttemptIds: ["attempt-1"],
    };

    expect(rowToProgress(progress, "u1")).toMatchObject(progress);
  });

  it("round-trips a database row", () => {
    const progress = {
      ...defaultProgress("u1"),
      completedModules: ["module-1"],
      achievements: ["first-lesson"],
    };

    expect(rowToProgress(progressToRow(progress), "u1")).toEqual(progress);
  });
});
