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
              reviewedAt: "2026-07-13T10:00:00.000Z",
            },
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({ id: "device-a:event-1", type: "vocabulary_review" }),
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
});
