import { describe, expect, it } from "vitest";
import { parseSyncBatch } from "./sync-schema";

describe("sync payload schema", () => {
  it("accepts a bounded, stable vocabulary event", () => {
    expect(
      parseSyncBatch({
        events: [
          {
            id: "device-a:event-1",
            deviceId: "device-a",
            type: "vocabulary_review",
            userId: "user-1",
            timestamp: "2026-07-13T10:00:00.000Z",
            synced: false,
            errorCount: 0,
            payload: {
              wordId: "word-1",
              rating: "good",
              mode: "production",
              reviewedAt: "2026-07-13T10:00:00.000Z",
            },
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        id: "device-a:event-1",
        type: "vocabulary_review",
        payload: expect.objectContaining({ mode: "production" }),
      }),
    ]);
  });

  it("rejects unsupported ratings and malformed timestamps before database access", () => {
    expect(() =>
      parseSyncBatch({
        events: [
          {
            id: "event-1",
            deviceId: "device-a",
            type: "vocabulary_review",
            userId: "user-1",
            timestamp: "not-a-date",
            payload: {
              wordId: "word-1",
              rating: "perfect",
              reviewedAt: "not-a-date",
            },
          },
        ],
      })
    ).toThrow();
  });

  it("rejects unaudited standalone exercise-result mutations", () => {
    expect(() => parseSyncBatch({
      events: [{
        id: "device-a:event-2",
        deviceId: "device-a",
        type: "exercise_result",
        userId: "user-1",
        timestamp: "2026-07-13T10:00:00.000Z",
        payload: {
          attemptId: "00000000-0000-4000-8000-000000000001",
          exerciseId: "exercise-1",
          exerciseType: "quiz",
          itemId: "item-1",
          status: "correct",
          durationMs: 1000,
        },
      }],
    })).toThrow();
  });
});
