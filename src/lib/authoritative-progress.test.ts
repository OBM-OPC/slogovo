import { describe, expect, it } from "vitest";
import { buildAuthoritativeProgress } from "./authoritative-progress";
import { defaultProgress } from "./progress-serialization";

describe("authoritative progress rebuild", () => {
  it("derives scores, streaks, mastery and reviews from server rows", () => {
    const settings = defaultProgress("u1").settings;
    const progress = buildAuthoritativeProgress("u1", [{
      id: "attempt-1", lesson_id: "a1-modul-1-lektion-1", module_id: "a1-modul-1", active_time_seconds: 120,
      finished_at: "2026-07-13T10:00:00.000Z", items_answered: 6, correct_count: 6, incorrect_count: 0,
      passed: true, mastered: true, score: 100,
    }], [{
      word_id: "m6l5-1", rating: "repeat", practice_mode: "production", reviewed_at: "2026-07-13T11:00:00.000Z", response_time_ms: 1500, error_category: "verb-conjugation",
    }], settings);
    expect(progress.completedLessons).toContain("a1-modul-1-lektion-1");
    expect(progress.masteredLessons).toContain("a1-modul-1-lektion-1");
    expect(progress.lessonScores["a1-modul-1-lektion-1"]).toBe(100);
    expect(progress.streak.current).toBe(1);
    expect(progress.vocabularyProgress["m6l5-1"]).toMatchObject({ lapseCount: 1, productionTotal: 1, lastResponseMs: 1500, lastErrorCategory: "verb-conjugation" });
  });
});
