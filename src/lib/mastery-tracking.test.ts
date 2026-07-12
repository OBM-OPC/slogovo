import { describe, expect, it } from "vitest";
import {
  getMasteryTracking,
  recordProductionAttempt,
  recordRecognitionAttempt,
  isProductivelyMastered,
  isReceptivelyMastered,
} from "./mastery-tracking";
import { VocabularyProgress } from "@/types";

function baseProgress(): VocabularyProgress {
  return {
    status: "new",
    timesCorrect: 0,
    timesWrong: 0,
    intervalIndex: 0,
    easeFactor: 2.5,
  };
}

describe("mastery-tracking", () => {
  it("tracks recognition separately from production", () => {
    let p = baseProgress();
    p = recordRecognitionAttempt(p, true);
    p = recordProductionAttempt(p, false);
    const m = getMasteryTracking(p);
    expect(m.recognitionCorrect).toBe(1);
    expect(m.recognitionTotal).toBe(1);
    expect(m.productionCorrect).toBe(0);
    expect(m.productionTotal).toBe(1);
  });

  it("requires at least 3 production attempts for productive mastery", () => {
    let p = baseProgress();
    p = recordProductionAttempt(p, true);
    p = recordProductionAttempt(p, true);
    expect(isProductivelyMastered(p)).toBe(false);
    p = recordProductionAttempt(p, true);
    expect(isProductivelyMastered(p)).toBe(true);
  });

  it("requires 70% accuracy for receptive mastery", () => {
    let p = baseProgress();
    for (let i = 0; i < 3; i++) p = recordRecognitionAttempt(p, true);
    p = recordRecognitionAttempt(p, false);
    expect(isReceptivelyMastered(p)).toBe(true); // 3/4 = 75%
    let p2 = baseProgress();
    p2 = recordRecognitionAttempt(p2, true);
    p2 = recordRecognitionAttempt(p2, false);
    expect(isReceptivelyMastered(p2)).toBe(false); // 1/2, below threshold and <3 attempts
  });
});
