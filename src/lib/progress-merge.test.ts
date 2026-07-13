import { describe, expect, it } from "vitest";
import { mergeProgress } from "./progress-merge";
import { UserProgress } from "@/types";

function baseProgress(userId: string): UserProgress {
  return {
    userId,
    streak: { current: 0, longest: 0 },
    completedLessons: [],
    masteredLessons: [],
    completedModules: [],
    vocabularyProgress: {},
    lessonScores: {},
    exerciseStats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    dailyStats: {},
    recordedAttemptIds: [],
    settings: {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: [],
  };
}

describe("mergeProgress", () => {
  it("merges completed lessons from two devices", () => {
    const local = {
      ...baseProgress("u1"),
      completedLessons: ["l1", "l2"],
    };
    const remote = {
      ...baseProgress("u1"),
      completedLessons: ["l3", "l4"],
    };
    const merged = mergeProgress(local, remote);
    expect(merged.completedLessons.sort()).toEqual(["l1", "l2", "l3", "l4"].sort());
  });

  it("keeps the highest lesson score", () => {
    const local = { ...baseProgress("u1"), lessonScores: { l1: 80 } };
    const remote = { ...baseProgress("u1"), lessonScores: { l1: 95 } };
    expect(mergeProgress(local, remote).lessonScores.l1).toBe(95);
  });

  it("preserves vocabulary review history from multiple devices", () => {
    const local = {
      ...baseProgress("u1"),
      vocabularyProgress: {
        w1: { status: "learning" as const, timesCorrect: 3, timesWrong: 0, intervalIndex: 2, easeFactor: 2.5 },
      },
    };
    const remote = {
      ...baseProgress("u1"),
      vocabularyProgress: {
        w2: { status: "learning" as const, timesCorrect: 2, timesWrong: 1, intervalIndex: 1, easeFactor: 2.5 },
      },
    };
    const merged = mergeProgress(local, remote);
    expect(merged.vocabularyProgress.w1).toBeDefined();
    expect(merged.vocabularyProgress.w2).toBeDefined();
  });

  it("preserves separate recognition and production counters across devices", () => {
    const local = {
      ...baseProgress("u1"),
      vocabularyProgress: {
        w1: {
          status: "review" as const,
          timesCorrect: 4,
          timesWrong: 0,
          intervalIndex: 2,
          recognitionCorrect: 4,
          recognitionTotal: 4,
          productionCorrect: 0,
          productionTotal: 0,
        },
      },
    };
    const remote = {
      ...baseProgress("u1"),
      vocabularyProgress: {
        w1: {
          status: "review" as const,
          timesCorrect: 3,
          timesWrong: 1,
          intervalIndex: 1,
          recognitionCorrect: 1,
          recognitionTotal: 2,
          productionCorrect: 2,
          productionTotal: 3,
        },
      },
    };

    expect(mergeProgress(local, remote).vocabularyProgress.w1).toMatchObject({
      recognitionCorrect: 4,
      recognitionTotal: 4,
      productionCorrect: 2,
      productionTotal: 3,
    });
  });

  it("does not drop progress from a device with fewer completed lessons", () => {
    const local = { ...baseProgress("u1"), completedLessons: ["l1"] };
    const remote = { ...baseProgress("u1"), completedLessons: ["l1", "l2", "l3"] };
    const merged = mergeProgress(local, remote);
    expect(merged.completedLessons.sort()).toEqual(["l1", "l2", "l3"].sort());
  });

  it("uses highest streak values", () => {
    const local = { ...baseProgress("u1"), streak: { current: 5, longest: 10 } };
    const remote = { ...baseProgress("u1"), streak: { current: 3, longest: 12 } };
    const merged = mergeProgress(local, remote);
    expect(merged.streak.current).toBe(5);
    expect(merged.streak.longest).toBe(12);
  });

  it("resolves settings with local last-write-wins", () => {
    const local = { ...baseProgress("u1"), settings: { ...baseProgress("u1").settings, ttsEnabled: false } };
    const remote = { ...baseProgress("u1"), settings: { ...baseProgress("u1").settings, ttsEnabled: true } };
    expect(mergeProgress(local, remote).settings.ttsEnabled).toBe(false);
  });
});
