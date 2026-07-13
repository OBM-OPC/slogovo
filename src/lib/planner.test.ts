import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "./planner";
import { VocabularyItem } from "@/types";

function word(id: string, de: string, bg: string): VocabularyItem {
  return { id, de, bg };
}

describe("buildDailyPlan", () => {
  it("prioritizes due reviews over new items", () => {
    const words = [word("w1", "Ja", "да"), word("w2", "Nein", "не")];
    const progress = {
      w1: { status: "review" as const, nextReview: "2026-01-01", timesCorrect: 2, timesWrong: 0, intervalIndex: 1 },
    };
    const plan = buildDailyPlan(words, progress, [], { dailyGoal: "medium" });
    expect(plan.reviewItems.length).toBeGreaterThan(0);
    expect(plan.reviewItems[0].wordId).toBe("w1");
    expect(plan.newItems.length).toBe(1);
  });

  it("limits new items when review backlog is high", () => {
    const words = Array.from({ length: 20 }).map((_, i) => word(`w${i}`, `W${i}`, `BG${i}`));
    const progress: Record<string, { status: "review"; nextReview: string; timesCorrect: number; timesWrong: number; intervalIndex: number }> = {};
    for (let i = 0; i < 15; i++) {
      progress[`w${i}`] = { status: "review", nextReview: "2026-01-01", timesCorrect: 1, timesWrong: 0, intervalIndex: 1 };
    }
    const plan = buildDailyPlan(words, progress, [], { dailyGoal: "intense" });
    expect(plan.reviewItems.length).toBe(15);
    expect(plan.newItems.length).toBeLessThanOrEqual(3);
  });

  it("includes recent mistakes as weak items", () => {
    const words = [word("w1", "Ja", "да")];
    const plan = buildDailyPlan(words, {}, ["w1"], { dailyGoal: "medium" });
    expect(plan.weakItems.length).toBe(1);
    expect(plan.weakItems[0].source).toBe("mistake");
  });

  it("sets recognition mode for new words and production for high accuracy", () => {
    const words = [word("w1", "Ja", "да"), word("w2", "Nein", "не")];
    const progress = {
      w2: { status: "review" as const, nextReview: "2026-01-01", timesCorrect: 10, timesWrong: 0, intervalIndex: 4 },
    };
    const plan = buildDailyPlan(words, progress, [], { dailyGoal: "medium" });
    const newItem = plan.newItems.find((i) => i.wordId === "w1");
    const prodItem = plan.productiveItems.find((i) => i.wordId === "w2");
    expect(newItem?.mode).toBe("recognition");
    expect(prodItem?.mode).toBe("production");
  });

  it("includes listening items when enabled", () => {
    const words = [word("w1", "Ja", "да")];
    const plan = buildDailyPlan(words, {}, [], { dailyGoal: "medium", includeListening: true });
    expect(plan.listeningItems.length).toBeGreaterThan(0);
  });

  it("returns a finite estimated time", () => {
    const words = Array.from({ length: 10 }).map((_, i) => word(`w${i}`, `W${i}`, `BG${i}`));
    const plan = buildDailyPlan(words, {}, [], { dailyGoal: "light", availableMinutes: 5 });
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(5);
  });

  it("uses separate recognition and production evidence to choose recall mode", () => {
    const words = [word("w1", "Ja", "да"), word("w2", "Nein", "не")];
    const progress = {
      w1: {
        status: "review" as const,
        nextReview: "2026-01-01",
        timesCorrect: 0,
        timesWrong: 0,
        intervalIndex: 1,
        recognitionCorrect: 3,
        recognitionTotal: 3,
        productionCorrect: 0,
        productionTotal: 0,
      },
      w2: {
        status: "review" as const,
        nextReview: "2026-01-01",
        timesCorrect: 10,
        timesWrong: 0,
        intervalIndex: 1,
        recognitionCorrect: 1,
        recognitionTotal: 3,
        productionCorrect: 0,
        productionTotal: 0,
      },
    };

    const plan = buildDailyPlan(words, progress);
    expect(plan.reviewItems.find((item) => item.wordId === "w1")?.mode).toBe("production");
    expect(plan.reviewItems.find((item) => item.wordId === "w2")?.mode).toBe("recognition");
  });

  it("includes recent material and grammar weaknesses in the bounded session", () => {
    const words = [word("w1", "Ja", "да"), word("w2", "Nein", "не")];
    const progress = {
      w1: {
        status: "review" as const,
        nextReview: "2099-01-01",
        lastReviewed: "2026-07-12",
        timesCorrect: 2,
        timesWrong: 0,
        intervalIndex: 1,
      },
    };
    const plan = buildDailyPlan(words, progress, [], {
      availableMinutes: 5,
      recentWordIds: ["w1"],
      grammarWeaknesses: [{ id: "grammar-1", title: "съм", href: "/grammatik/verb-sein" }],
    });

    expect(plan.recentItems.map((item) => item.wordId)).toContain("w1");
    expect(plan.grammarItems).toEqual([
      expect.objectContaining({ grammarId: "grammar-1", source: "grammar" }),
    ]);
    expect(plan.sessionItems).toContainEqual(expect.objectContaining({ source: "grammar" }));
    expect(plan.sessionItems.length).toBeLessThanOrEqual(10);
  });

  it("reserves optional speaking work without making it a Phase 6 default", () => {
    const words = [word("w1", "Ja", "да")];
    expect(buildDailyPlan(words, {}).speakingItems).toEqual([]);
    const speakingPlan = buildDailyPlan(words, {}, [], { includeSpeaking: true });
    expect(speakingPlan.speakingItems)
      .toEqual([expect.objectContaining({ wordId: "w1", source: "speaking", mode: "production" })]);
    expect(speakingPlan.sessionItems)
      .toContainEqual(expect.objectContaining({ wordId: "w1", source: "speaking" }));
  });
});
