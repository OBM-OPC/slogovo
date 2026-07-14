import { describe, expect, it } from "vitest";
import { achievementProgress, checkAchievements } from "@/lib/achievements";
import { createDefaultProgress } from "@/lib/progress-db";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { learningMetrics } from "./gamification";
import { calculateLearningXp } from "./learning-xp";

describe("learning-based gamification", () => {
  it("derives rewards from mastery, productive practice, review days, active time, and goals", () => {
    const progress = createDefaultProgress("u1");
    progress.settings.dailyGoal = "light";
    progress.settings.weeklyLessonGoal = 3;
    progress.settings.alphabetCompleted = true;
    progress.masteredLessons = ["l1", "l2", "l3", "l4", "l5"];
    progress.streak.current = 7;
    for (let index = 0; index < 100; index += 1) {
      progress.vocabularyProgress[`v${index}`] = {
        status: "mastered",
        timesCorrect: 3,
        timesWrong: 0,
        intervalIndex: 4,
        lastReviewed: `2026-07-${String((index % 7) + 7).padStart(2, "0")}`,
        productionCorrect: 1,
        productionTotal: 1,
      };
    }
    for (let day = 9; day <= 13; day += 1) {
      progress.dailyStats[`2026-07-${String(day).padStart(2, "0")}`] = { minutes: 24, activeSeconds: 1440, vocabulary: 3, lessons: 1 };
    }
    progress.exerciseStats.listeningCorrect = 40;
    progress.exerciseStats.listeningTotal = 50;

    expect(learningMetrics(progress, new Date("2026-07-13T12:00:00"))).toEqual({
      masteredWords: 100,
      distinctReviewDays: 7,
      productionAttempts: 100,
      masteredGrammarLessons: 5,
      activeMinutes: 120,
      weeklyGoalDays: 5,
      weeklyLessons: 5,
      listeningCorrect: 40,
      listeningTotal: 50,
    });
    expect(checkAchievements(progress, new Date("2026-07-13T12:00:00"))).toEqual(expect.arrayContaining([
      "first-conversation", "alphabet-mastered", "first-steps", "seven-day-streak", "hundred-vocabulary", "review-rhythm",
      "speaking-practice", "a1-master", "world-citizen", "listening-expert", "weekly-goal",
    ]));
    expect(achievementProgress("weekly-goal", progress, new Date("2026-07-13T12:00:00"))).toEqual({ current: 5, target: 3, percent: 100 });
    expect(achievementProgress("listening-expert", progress).percent).toBe(100);
  });

  it("awards no XP for clicking through, failing, or having no measured activity", () => {
    expect(calculateLearningXp({ passed: true, mastered: false, activeTimeSeconds: 60, results: [] })).toBe(0);
    expect(calculateLearningXp({ passed: false, mastered: false, activeTimeSeconds: 60, results: [makeExerciseResult(["correct"])] })).toBe(0);
    expect(calculateLearningXp({ passed: true, mastered: false, activeTimeSeconds: 0, results: [makeExerciseResult(["correct"])] })).toBe(0);
  });

  it("counts only unique first attempts toward XP", () => {
    const wrong = makeExerciseResult(["wrong"], { exerciseId: "core", attemptNumber: 1 });
    const retry = makeExerciseResult(["correct"], { exerciseId: "core", attemptNumber: 2 });
    expect(calculateLearningXp({ passed: true, mastered: false, activeTimeSeconds: 60, results: [wrong, retry] })).toBe(1);
  });
});
