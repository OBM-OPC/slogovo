import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  disableAutoSync,
  enableAutoSync,
  processSyncQueue,
  sendSyncBatch,
  type SyncTransport,
} from "./sync";
import {
  addEvent,
  addLessonAttemptEvent,
  clearQueue,
  getPendingEvents,
  type SyncEvent,
} from "./sync-queue";
import { createLessonAttempt } from "./lesson-attempts";
import { makeExerciseResult } from "@/test/learning-fixtures";

function successfulTransport(): SyncTransport {
  return vi.fn(async (events: SyncEvent[]) => ({
    processed: events.map((event) => event.id),
    failed: [],
  }));
}

describe("processSyncQueue", () => {
  beforeEach(() => {
    clearQueue();
    disableAutoSync();
    vi.unstubAllGlobals();
  });

  it("syncs pending vocabulary review events through the server transport", async () => {
    addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const transport = successfulTransport();
    const result = await processSyncQueue("u1", transport);
    expect(result).toMatchObject({ processed: 1, failed: 0 });
    expect(transport).toHaveBeenCalledOnce();
    expect(getPendingEvents("u1")).toHaveLength(0);
  });

  it("does not submit duplicate lesson attempts from client retries", async () => {
    const attempt = createLessonAttempt({
      id: "00000000-0000-4000-8000-000000000077",
      userId: "u1",
      lessonId: "a1-modul-1-lektion-1",
      moduleId: "a1-modul-1",
      level: "A1",
      results: [makeExerciseResult(["correct"])],
      totalDurationMs: 12_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 80,
    });
    addLessonAttemptEvent(attempt);
    addLessonAttemptEvent(attempt);
    const transport = successfulTransport();
    await processSyncQueue("u1", transport);

    expect(transport).toHaveBeenCalledWith([expect.objectContaining({ id: attempt.id })]);
  });

  it("preserves failed events for later retry instead of silently dropping them", async () => {
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const transport: SyncTransport = vi.fn().mockRejectedValue(new Error("offline"));

    await processSyncQueue("u1", transport);
    await processSyncQueue("u1", transport);

    expect(getPendingEvents("u1")).toEqual([
      expect.objectContaining({ id: event.id, errorCount: 2, error: "offline" }),
    ]);
  });

  it("posts batches only to the same-origin authenticated API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ processed: ["event-1"], failed: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const event = addEvent(
      {
        type: "vocabulary_review",
        userId: "u1",
        timestamp: new Date().toISOString(),
        payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
      },
      "event-1"
    );

    await sendSyncBatch([event]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/sync",
      expect.objectContaining({ method: "POST", credentials: "same-origin" })
    );
  });

  it("retries the offline queue when the browser reconnects", async () => {
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: "2026-07-13T10:00:00.000Z",
      payload: {
        wordId: "word-1",
        rating: "good",
        reviewedAt: "2026-07-13T10:00:00.000Z",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ processed: [event.id], failed: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const saveAggregate = vi.fn().mockResolvedValue(undefined);
    enableAutoSync("u1", saveAggregate);
    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => expect(getPendingEvents("u1")).toHaveLength(0));
    expect(saveAggregate).toHaveBeenCalledOnce();
  });
});
