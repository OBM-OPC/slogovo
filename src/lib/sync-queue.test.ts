import { beforeEach, describe, expect, it } from "vitest";
import { addEvent, clearQueue, getPendingEvents, markFailed, markSynced } from "./sync-queue";

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
});
