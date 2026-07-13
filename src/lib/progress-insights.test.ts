import { describe, expect, it } from "vitest";
import { createDefaultProgress } from "@/lib/progress-db";
import { buildProgressInsights, type ProgressAttemptSummary } from "./progress-insights";

describe("progress insights", () => {
  it("derives mastery, due work, skills, weak areas, and improvement from real state", () => {
    const progress = createDefaultProgress("u1");
    progress.completedLessons = ["l1", "l2"];
    progress.masteredLessons = ["l1"];
    progress.lessonScores = { l1: 92, l2: 64 };
    progress.dailyStats = { "2026-07-13": { minutes: 12, activeSeconds: 720, vocabulary: 4 } };
    progress.vocabularyProgress = {
      due: { status: "review", nextReview: "2026-07-12", timesCorrect: 3, timesWrong: 1, intervalIndex: 2, recognitionCorrect: 3, recognitionTotal: 3 },
      productive: { status: "mastered", nextReview: "2026-08-01", timesCorrect: 4, timesWrong: 0, intervalIndex: 4, productionCorrect: 3, productionTotal: 4 },
    };
    const attempts: ProgressAttemptSummary[] = Array.from({ length: 10 }, (_, index) => ({
      score: index < 5 ? 80 : 60,
      finishedAt: `2026-07-${String(13 - index).padStart(2, "0")}T10:00:00.000Z`,
      skills: [
        { exerciseType: "listen", correct: index % 2, total: 1 },
        { exerciseType: "fill-in", correct: 1, total: 1 },
      ],
    }));

    const insights = buildProgressInsights(progress, attempts, [
      { lessonId: "l1", title: "Sein" },
      { lessonId: "l2", title: "Artikel" },
    ], "2026-07-13");

    expect(insights).toMatchObject({
      activeStudyMinutes: 12,
      lessonsPassed: 2,
      lessonsMastered: 1,
      vocabularyDue: 1,
      receptiveVocabularyMastered: 1,
      productiveVocabularyMastered: 1,
      listening: { correct: 5, total: 10, accuracy: 0.5 },
      recentImprovement: 20,
    });
    expect(insights.grammarSkills.map((skill) => skill.score)).toEqual([64, 92]);
    expect(insights.weakAreas).toContainEqual({ label: "Hörverstehen", accuracy: 0.5 });
  });

  it("uses explicit empty states instead of fabricated percentages", () => {
    const insights = buildProgressInsights(createDefaultProgress("u1"), [], [], "2026-07-13");
    expect(insights.listening.accuracy).toBeNull();
    expect(insights.recentImprovement).toBeNull();
    expect(insights.weakAreas).toEqual([]);
  });
});
