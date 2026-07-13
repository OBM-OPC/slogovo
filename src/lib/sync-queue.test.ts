import { beforeEach, describe, expect, it } from "vitest";
import { addEvent, addLessonAttemptEvent, clearQueue, getPendingEvents, markFailed, markSynced } from "./sync-queue";
import { createLessonAttempt } from "./lesson-attempts";
import { makeExerciseResult } from "@/test/learning-fixtures";

describe("sync-queue", () => {
  beforeEach(() => {
    clearQueue();
  });

  it("adds pending events", () => {
    addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: "2026-07-13T00:00:00Z",
      payload: { wordId: "w1", rating: "good", reviewedAt: "2026-07-13T00:00:00Z" },
    });
    expect(getPendingEvents("u1").length).toBe(1);
  });

  it("marks events synced", () => {
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: "2026-07-13T00:00:00Z",
      payload: { wordId: "w1", rating: "good", reviewedAt: "2026-07-13T00:00:00Z" },
    });
    markSynced(event.id);
    expect(getPendingEvents("u1").length).toBe(0);
  });

  it("increments error count on failure", () => {
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: "2026-07-13T00:00:00Z",
      payload: { wordId: "w1", rating: "good", reviewedAt: "2026-07-13T00:00:00Z" },
    });
    markFailed(event.id, "network error");
    const pending = getPendingEvents("u1");
    expect(pending.length).toBe(1);
    expect(pending[0].error).toBe("network error");
    expect(pending[0].errorCount).toBe(1);
  });

  it("marks event synced after three failures", () => {
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: "2026-07-13T00:00:00Z",
      payload: { wordId: "w1", rating: "good", reviewedAt: "2026-07-13T00:00:00Z" },
    });
    markFailed(event.id, "e1");
    markFailed(event.id, "e2");
    markFailed(event.id, "e3");
    expect(getPendingEvents("u1").length).toBe(0);
  });

  it("writes actual lesson result values and deduplicates client retries", () => {
    const attempt = createLessonAttempt({
      id: "00000000-0000-4000-8000-000000000099",
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [makeExerciseResult(["correct", "wrong"])],
      totalDurationMs: 42_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      finishedAt: "2026-07-13T10:00:42.000Z",
      completed: true,
      requiredScore: 80,
    });
    const first = addLessonAttemptEvent(attempt);
    const retry = addLessonAttemptEvent(attempt);
    expect(retry.id).toBe(first.id);
    expect(getPendingEvents("u1")).toHaveLength(1);
    expect(first.payload).toMatchObject({
      attempt: {
        score: 50,
        accuracy: 0.5,
        passed: false,
        mastered: false,
        activeTimeSeconds: 42,
        correctCount: 1,
        incorrectCount: 1,
      },
    });
  });
});
