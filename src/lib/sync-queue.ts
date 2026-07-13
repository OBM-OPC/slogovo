export type SyncEventType =
  | "lesson_attempt"
  | "vocabulary_review"
  | "settings_changed";

export interface BaseSyncEvent {
  id: string;
  deviceId: string;
  type: SyncEventType;
  userId: string;
  timestamp: string;
  synced: boolean;
  error?: string;
  errorCount: number;
}

export interface LessonAttemptEvent extends BaseSyncEvent {
  type: "lesson_attempt";
  payload: {
    attempt: import("@/types").LessonAttempt;
  };
}

export interface VocabularyReviewEvent extends BaseSyncEvent {
  type: "vocabulary_review";
  payload: {
    wordId: string;
    rating: string;
    reviewedAt: string;
  };
}

export interface SettingsChangedEvent extends BaseSyncEvent {
  type: "settings_changed";
  payload: {
    settings: Record<string, unknown>;
  };
}

export type SyncEvent =
  | LessonAttemptEvent
  | VocabularyReviewEvent
  | SettingsChangedEvent;

const STORAGE_KEY = "slogovo-sync-queue-v1";
const DEVICE_ID_KEY = "slogovo-device-id-v1";
let volatileDeviceId: string | null = null;

function randomToken(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const created = `device-${randomToken()}`;
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    volatileDeviceId ??= `device-${randomToken()}`;
    return volatileDeviceId;
  }
}

export function loadQueue(): SyncEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncEvent[];
    if (!Array.isArray(parsed)) return [];
    const deviceId = getDeviceId();
    return parsed.map((event) => ({ ...event, deviceId: event.deviceId || deviceId }));
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function generateEventId(deviceId = getDeviceId()): string {
  return `${deviceId}:${randomToken()}`;
}

type QueueManagedFields = "id" | "deviceId" | "synced" | "errorCount" | "error";
type NewSyncEvent = SyncEvent extends infer Event
  ? Event extends SyncEvent
    ? Omit<Event, QueueManagedFields> & { deviceId?: string }
    : never
  : never;

export function addEvent(
  event: NewSyncEvent,
  eventId = generateEventId(event.deviceId ?? getDeviceId())
): SyncEvent {
  const queue = loadQueue();
  const existing = queue.find((queued) => queued.id === eventId);
  if (existing) return existing;
  const full: SyncEvent = {
    ...event,
    id: eventId,
    deviceId: event.deviceId ?? getDeviceId(),
    synced: false,
    errorCount: 0,
  } as SyncEvent;
  queue.push(full);
  saveQueue(queue);
  return full;
}

export function addLessonAttemptEvent(attempt: import("@/types").LessonAttempt): SyncEvent {
  return addEvent({
    type: "lesson_attempt",
    userId: attempt.userId,
    timestamp: attempt.finishedAt ?? new Date().toISOString(),
    payload: { attempt },
  }, attempt.id);
}

export function getPendingEvents(userId?: string): SyncEvent[] {
  const queue = loadQueue();
  const pending = queue.filter((e) => !e.synced);
  return userId ? pending.filter((e) => e.userId === userId) : pending;
}

export function markSynced(eventId: string): void {
  const queue = loadQueue();
  const updated = queue.map((e) => (e.id === eventId ? { ...e, synced: true } : e));
  saveQueue(updated);
}

export function markFailed(eventId: string, error: string): void {
  const queue = loadQueue();
  const updated = queue.map((e) =>
    e.id === eventId
      ? { ...e, error, errorCount: e.errorCount + 1 }
      : e
  );
  saveQueue(updated);
}

export function clearQueue(): void {
  saveQueue([]);
}

export function clearSynced(): void {
  const queue = loadQueue();
  saveQueue(queue.filter((e) => !e.synced));
}

export function removeEvent(eventId: string): void {
  const queue = loadQueue();
  saveQueue(queue.filter((e) => e.id !== eventId));
}
