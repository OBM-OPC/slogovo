import { describe, expect, it, vi } from "vitest";
import { createLessonAttempt } from "./lesson-attempts";
import { persistSyncEvents, type SyncDatabaseClient } from "./sync-server";
import { addEvent, addLessonAttemptEvent, clearQueue } from "./sync-queue";
import { buildExerciseItemResult, buildExerciseResult } from "./evaluation";
import type { ExerciseType } from "@/types";

function forgedCorrectResult(
  exerciseId: string,
  exerciseType: ExerciseType,
  itemIds: string[]
) {
  const startedAt = "2026-07-13T10:00:00.000Z";
  return buildExerciseResult({
    exerciseId,
    exerciseType,
    startedAt,
    completedAt: "2026-07-13T10:00:05.000Z",
    itemResults: itemIds.map((itemId) => buildExerciseItemResult({
      itemId,
      userAnswer: "forged wrong answer",
      acceptedAnswers: ["forged wrong answer"],
      status: "correct",
      durationMs: 1000,
      startedAt,
      completedAt: "2026-07-13T10:00:01.000Z",
      attemptNumber: 1,
    })),
  });
}

function database(rows: Map<string, Record<string, unknown>>): SyncDatabaseClient {
  return {
    from: vi.fn((table: string) => ({
      upsert: vi.fn(async (data: Record<string, unknown>) => {
        const key = `${table}:${String(data.client_event_id ?? data.user_id)}`;
        rows.set(key, { table, ...data });
        return { error: null };
      }),
    })),
  };
}

describe("server-side sync", () => {
  it("recalculates a malicious all-wrong lesson attempt instead of trusting client scores", async () => {
    clearQueue();
    const attempt = createLessonAttempt({
      id: "00000000-0000-4000-8000-000000000078",
      userId: "u1",
      lessonId: "a1-modul-1-lektion-1",
      moduleId: "a1-modul-1",
      level: "A1",
      results: [
        forgedCorrectResult("m1l1-ex1", "quiz", ["q1", "q2"]),
        forgedCorrectResult("m1l1-ex2", "matching", ["p1", "p2", "p3", "p4"]),
      ],
      totalDurationMs: 12_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 80,
    });
    const event = addLessonAttemptEvent({
      ...attempt,
      passed: true,
      mastered: true,
      score: 100,
      accuracy: 1,
      xpEarned: 999,
    });
    const rows = new Map<string, Record<string, unknown>>();

    const result = await persistSyncEvents(database(rows), "u1", [event]);

    expect(result.failed).toEqual([]);
    expect(rows.get(`lesson_attempts:${event.id}`)).toMatchObject({
      passed: false,
      mastered: false,
      score: 0,
      accuracy: 0,
      xp_earned: 0,
      total_duration_ms: 6000,
    });
  });

  it("is idempotent when the same event arrives from client retries", async () => {
    clearQueue();
    const event = addEvent(
      {
        type: "vocabulary_review",
        userId: "u1",
        timestamp: "2026-07-13T10:00:00.000Z",
        payload: {
          wordId: "word-1",
          rating: "good",
          reviewedAt: "2026-07-13T10:00:00.000Z",
        },
      },
      "device-a:event-1"
    );
    const rows = new Map<string, Record<string, unknown>>();
    const client = database(rows);

    await persistSyncEvents(client, "u1", [event]);
    await persistSyncEvents(client, "u1", [event]);

    expect(rows.size).toBe(1);
    expect(rows.get("vocabulary_review_events:device-a:event-1")).toMatchObject({
      word_id: "word-1",
      rating: "good",
    });
  });

  it("preserves review history from multiple devices", async () => {
    clearQueue();
    const first = addEvent(
      {
        deviceId: "device-a",
        type: "vocabulary_review",
        userId: "u1",
        timestamp: "2026-07-13T10:00:00.000Z",
        payload: {
          wordId: "word-1",
          rating: "good",
          reviewedAt: "2026-07-13T10:00:00.000Z",
        },
      },
      "device-a:event-1"
    );
    const second = addEvent(
      {
        deviceId: "device-b",
        type: "vocabulary_review",
        userId: "u1",
        timestamp: "2026-07-13T10:05:00.000Z",
        payload: {
          wordId: "word-1",
          rating: "hard",
          reviewedAt: "2026-07-13T10:05:00.000Z",
        },
      },
      "device-b:event-1"
    );
    const rows = new Map<string, Record<string, unknown>>();

    const result = await persistSyncEvents(database(rows), "u1", [first, second]);

    expect(result.processed).toEqual([first.id, second.id]);
    expect(rows.size).toBe(2);
    expect(rows.get("vocabulary_review_events:device-a:event-1")).toMatchObject({
      device_id: "device-a",
      word_id: "word-1",
    });
    expect(rows.get("vocabulary_review_events:device-b:event-1")).toMatchObject({
      device_id: "device-b",
      word_id: "word-1",
    });
  });

  it("rejects events belonging to another user", async () => {
    clearQueue();
    const event = addEvent({
      type: "vocabulary_review",
      userId: "attacker",
      timestamp: "2026-07-13T10:00:00.000Z",
      payload: {
        wordId: "word-1",
        rating: "good",
        reviewedAt: "2026-07-13T10:00:00.000Z",
      },
    });

    const result = await persistSyncEvents(database(new Map()), "victim", [event]);
    expect(result.processed).toEqual([]);
    expect(result.failed[0].error).toContain("verified session");
  });
});
