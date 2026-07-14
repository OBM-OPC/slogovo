import { getPendingEvents, markFailed, markSynced, type SyncEvent } from "./sync-queue";
import type { SyncBatchResult } from "./sync-server";
import { trackMonitoringEvent } from "./telemetry";

export interface SyncResult {
  processed: number;
  failed: number;
  errors: string[];
}

export type SyncTransport = (events: SyncEvent[]) => Promise<SyncBatchResult>;

let autoSyncUserId: string | null = null;
let onlineHandler: (() => void) | null = null;
let reconnectCallback: (() => void | Promise<void>) | null = null;

export async function sendSyncBatch(events: SyncEvent[]): Promise<SyncBatchResult> {
  const response = await fetch("/api/sync", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schemaVersion: 1, events }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Sync failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<SyncBatchResult>;
}

export async function processSyncQueue(
  userId: string,
  transport: SyncTransport = sendSyncBatch
): Promise<SyncResult> {
  const events = getPendingEvents(userId);
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };
  if (events.length === 0) return result;

  try {
    const response = await transport(events);
    const processedIds = new Set(response.processed);
    const failures = new Map(response.failed.map((failure) => [failure.id, failure.error]));

    for (const event of events) {
      if (processedIds.has(event.id)) {
        markSynced(event.id);
        result.processed += 1;
      } else {
        const message = failures.get(event.id) ?? "Server did not acknowledge event";
        markFailed(event.id, message);
        result.failed += 1;
        result.errors.push(`${event.id}: ${message}`);
      }
    }
    if (result.failed > 0) {
      trackMonitoringEvent("sync_failure", {
        errorCode: "SYNC_EVENT_REJECTED",
        count: result.failed,
        online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network sync failed";
    for (const event of events) markFailed(event.id, message);
    result.failed = events.length;
    result.errors.push(message);
    trackMonitoringEvent("sync_failure", {
      errorCode: "SYNC_TRANSPORT_FAILED",
      count: events.length,
      online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
    });
  }

  return result;
}

export function enableAutoSync(
  userId: string,
  onReconnect?: () => void | Promise<void>
): void {
  if (typeof window === "undefined") return;
  if (autoSyncUserId === userId) {
    reconnectCallback = onReconnect ?? reconnectCallback;
    return;
  }
  disableAutoSync();
  autoSyncUserId = userId;
  reconnectCallback = onReconnect ?? null;
  onlineHandler = () => {
    void processSyncQueue(userId);
    void reconnectCallback?.();
  };
  window.addEventListener("online", onlineHandler);
}

export function disableAutoSync(): void {
  if (typeof window !== "undefined" && onlineHandler) {
    window.removeEventListener("online", onlineHandler);
  }
  onlineHandler = null;
  autoSyncUserId = null;
  reconnectCallback = null;
}

export function scheduleSync(userId: string, delayMs = 5000): void {
  if (typeof window === "undefined") return;
  enableAutoSync(userId);
  setTimeout(() => {
    void processSyncQueue(userId);
  }, delayMs);
}
