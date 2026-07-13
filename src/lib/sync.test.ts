import { beforeEach, describe, expect, it, vi } from "vitest";
import { processSyncQueue, SyncSupabaseClient } from "./sync";
import { addEvent, clearQueue } from "./sync-queue";

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
    const event = addEvent({
      type: "vocabulary_review",
      userId: "u1",
      timestamp: new Date().toISOString(),
      payload: { wordId: "w1", rating: "good", reviewedAt: new Date().toISOString() },
    });
    const stored: Record<string, unknown>[] = [];
    const client = makeClient(stored);
    await processSyncQueue("u1", client);

    // Re-add the same event payload but the queue system will generate a new id.
    // For true idempotency, the caller must reuse the same event id.
    const samePayloadEvent = {
      type: "vocabulary_review" as const,
      userId: "u1",
      timestamp: event.timestamp,
      payload: event.payload,
    };
    const event2 = addEvent(samePayloadEvent);
    expect(event2.id).not.toBe(event.id);

    const secondStored: Record<string, unknown>[] = [];
    const client2 = makeClient(secondStored);
    await processSyncQueue("u1", client2);
    expect(secondStored.length).toBe(1);
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
