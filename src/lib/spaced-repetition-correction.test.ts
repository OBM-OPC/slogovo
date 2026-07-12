import { describe, expect, it } from "vitest";
import { recordCorrectionAttempt } from "./spaced-repetition-correction";

describe("recordCorrectionAttempt", () => {
  it("does not change spaced repetition schedule", () => {
    const progress = {
      status: "review" as const,
      nextReview: "2026-07-20",
      intervalIndex: 2,
      timesCorrect: 5,
      timesWrong: 1,
      easeFactor: 2.5,
    };
    const afterCorrect = recordCorrectionAttempt(progress, true);
    expect(afterCorrect.nextReview).toBe("2026-07-20");
    expect(afterCorrect.intervalIndex).toBe(2);
    expect(afterCorrect.timesCorrect).toBe(6);

    const afterWrong = recordCorrectionAttempt(progress, false);
    expect(afterWrong.nextReview).toBe("2026-07-20");
    expect(afterWrong.timesWrong).toBe(2);
  });
});
