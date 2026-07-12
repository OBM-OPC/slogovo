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
});
