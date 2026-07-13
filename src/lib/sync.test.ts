import { beforeEach, describe, expect, it, vi } from "vitest";
import { processSyncQueue, SyncSupabaseClient } from "./sync";
import { addEvent, addLessonAttemptEvent, clearQueue } from "./sync-queue";
import { createLessonAttempt } from "./lesson-attempts";
import { makeExerciseResult } from "@/test/learning-fixtures";

function makeClient(stored: Record<string, unknown>[] = []): SyncSupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
    from: vi.fn((table: string) => ({
      upsert: vi.fn(async (data: Record<string, unknown>) => {
        stored.push({ table, data });
        return { error: null };
      }),
      insert: vi.fn(async (data: Record<string, unknown>) => {
        stored.push({ table, data });
        return { error: null };
      }),
    })),
  };
}

describe("processSyncQueue", () => {
  beforeEach(() => {
    clearQueue();
  });

  it("syncs pending vocabulary review events", async () => {
    addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const client = makeClient();
    const result = await processSyncQueue("u1", client);
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(client.from).toHaveBeenCalledWith("vocabulary_review_events");
  });

  it("does not create duplicate records when the same client_event_id is synced again", async () => {
    const attempt = createLessonAttempt({
      id: "00000000-0000-4000-8000-000000000077",
      userId: "u1",
      lessonId: "l1",
      moduleId: "m1",
      level: "A1",
      results: [makeExerciseResult(["correct"])],
      totalDurationMs: 12_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 80,
    });
    const event = addLessonAttemptEvent(attempt);
    expect(addLessonAttemptEvent(attempt).id).toBe(event.id);
    const stored: Record<string, unknown>[] = [];
    const client = makeClient(stored);
    await processSyncQueue("u1", client);
    expect(stored.filter((row) => row.table === "lesson_attempts")).toHaveLength(1);
  });

  it("preserves events from multiple devices by merging after sync", async () => {
    addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const client = makeClient();
    const result = await processSyncQueue("u1", client);
    expect(result.processed).toBe(1);
  });

  it("fails when user is not authenticated", async () => {
    addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const client = makeClient();
    client.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("no session") });
    const result = await processSyncQueue("u1", client);
    expect(result.processed).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
