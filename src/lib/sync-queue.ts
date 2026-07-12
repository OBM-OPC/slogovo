export type SyncEventType =
  | "lesson_completed"
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

export interface LessonCompletedEvent extends BaseSyncEvent {
  type: "lesson_completed";
  payload: {
    lessonId: string;
    moduleId: string;
    level: string;
    passed: boolean;
    accuracy: number;
    score: number;
    xpEarned: number;
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
  | LessonCompletedEvent
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

export function addEvent(event: Omit<SyncEvent, "id" | "synced" | "errorCount" | "error">): SyncEvent {
  const full: SyncEvent = {
    ...event,
    id: generateEventId(),
    synced: false,
    errorCount: 0,
  } as SyncEvent;
  const queue = loadQueue();
  queue.push(full);
  saveQueue(queue);
  return full;
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
