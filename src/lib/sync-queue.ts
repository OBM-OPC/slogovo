export type SyncEventType =
  | "lesson_attempt"
  | "exercise_result"
  | "vocabulary_review"
  | "settings_changed";

export interface BaseSyncEvent {
  id: string;
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

export interface ExerciseResultEvent extends BaseSyncEvent {
  type: "exercise_result";
  payload: {
    attemptId: string;
    exerciseId: string;
    exerciseType: string;
    itemId: string;
    status: string;
    durationMs: number;
    vocabularyId?: string;
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
  | ExerciseResultEvent
  | VocabularyReviewEvent
  | SettingsChangedEvent;

const STORAGE_KEY = "slogovo-sync-queue-v1";

export function loadQueue(): SyncEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncEvent[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function addEvent(
  event: Omit<SyncEvent, "id" | "synced" | "errorCount" | "error">,
  eventId = generateEventId()
): SyncEvent {
  const queue = loadQueue();
  const existing = queue.find((queued) => queued.id === eventId);
  if (existing) return existing;
  const full: SyncEvent = {
    ...event,
    id: eventId,
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
      ? { ...e, error, errorCount: e.errorCount + 1, synced: e.errorCount >= 2 }
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
