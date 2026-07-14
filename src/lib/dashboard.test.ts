import { describe, expect, it } from "vitest";
import { buildDashboardData } from "./dashboard";
import { createDefaultProgress } from "./progress-db";
import type { ModuleMeta } from "@/types";

const modules: ModuleMeta[] = [{ moduleId: "a1-1", level: "A1", title: "Begrüßung", description: "", order: 1, lessons: [{ lessonId: "lesson-1", title: "Hallo", duration: "6 Min." }, { lessonId: "lesson-2", title: "Vorstellen", duration: "8 Min." }] }];

describe("dashboard model", () => {
  it("derives the next action, due review, weekly goal, stats, and achievement from authoritative progress", () => {
    const progress = createDefaultProgress("user-1");
    progress.completedLessons = ["lesson-1"];
    progress.masteredLessons = ["lesson-1"];
    progress.streak.current = 3;
    progress.dailyStats = {
      "2026-07-13": { minutes: 15, vocabulary: 2, activeSeconds: 900 },
      "2026-07-14": { minutes: 20, vocabulary: 2, activeSeconds: 1200 },
    };
    progress.vocabularyProgress = {
      due: { status: "review", nextReview: "2026-07-14", timesCorrect: 2, timesWrong: 0, intervalIndex: 1, recognitionCorrect: 3, recognitionTotal: 3 },
      new: { status: "new", timesCorrect: 0, timesWrong: 0, intervalIndex: 0 },
    };
    const data = buildDashboardData(progress, modules, new Date("2026-07-14T12:00:00Z"));

    expect(data.nextAction.title).toBe("Vorstellen");
    expect(data.nextAction.href).toBe("/heute-lernen");
    expect(data.nextAction.moduleProgress).toBe(50);
    expect(data.review).toEqual({ due: 1, estimatedMinutes: 1 });
    expect(data.weeklyGoal.completedDays).toBe(2);
    expect(data.weeklyGoal.targetDays).toBe(4);
    expect(data.stats).toEqual({ streak: 3, lessons: 1, activeMinutes: 35, masteredWords: 0 });
    expect(data.nextAchievement?.title).toBeTruthy();
  });

  it("uses the onboarding recommendation for a learner's first dashboard action", () => {
    const progress = createDefaultProgress("user-1");
    progress.settings.onboarding = {
      completed: true,
      knowsCyrillic: false,
      priorBulgarian: "none",
      knowsSlavicLanguage: false,
      learningGoal: "travel",
      recommendedPath: "alphabet",
    };

    const data = buildDashboardData(progress, modules);

    expect(data.nextAction.href).toBe("/alphabet");
    expect(data.nextAction.title).toBe("Kyrillisch lesen lernen");
  });
});
