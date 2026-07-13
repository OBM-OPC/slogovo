import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { SyncEvent, getPendingEvents, markSynced, markFailed } from "./sync-queue";

export interface SyncResult {
  processed: number;
  failed: number;
  errors: string[];
}

export type SyncSupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>;
  };
  from: (table: string) => {
    upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: Error | null }>;
    insert: (data: Record<string, unknown>) => Promise<{ error: Error | null }>;
  };
};

export async function processSyncQueue(
  userId: string,
  client?: SyncSupabaseClient
): Promise<SyncResult> {
  const events = getPendingEvents(userId);
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };

  if (events.length === 0) return result;

  const supabase = client ?? (createBrowserClient() as unknown as SyncSupabaseClient);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.id !== userId) {
    result.errors.push("User not authenticated");
    return result;
  }

  for (const event of events) {
    try {
      const ok = await sendEvent(supabase, event);
      if (ok) {
        markSynced(event.id);
        result.processed += 1;
      } else {
        markFailed(event.id, "Server rejected event");
        result.failed += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      markFailed(event.id, message);
      result.failed += 1;
      result.errors.push(`${event.id}: ${message}`);
    }
  }

  return result;
}

async function sendEvent(supabase: SyncSupabaseClient, event: SyncEvent): Promise<boolean> {
  switch (event.type) {
    case "vocabulary_review": {
      const { wordId, rating, reviewedAt } = event.payload;
      const { error } = await supabase.from("vocabulary_review_events").upsert(
        {
          user_id: event.userId,
          word_id: wordId,
          rating,
          reviewed_at: reviewedAt,
          client_event_id: event.id,
        },
        { onConflict: "user_id, client_event_id" }
      );
      return !error;
    }

    case "lesson_completed": {
      const { lessonId, moduleId, level, passed, accuracy, score, xpEarned } = event.payload;
      const { error } = await supabase.from("lesson_attempts").upsert(
        {
          user_id: event.userId,
          lesson_id: lessonId,
          module_id: moduleId,
          level,
          passed,
          accuracy,
          score,
          xp_earned: xpEarned,
          results: [],
          total_duration_ms: 0,
          started_at: event.timestamp,
          completed: true,
          client_event_id: event.id,
        },
        { onConflict: "user_id, client_event_id" }
      );
      return !error;
    }

    case "exercise_result": {
      const { attemptId, exerciseId, exerciseType, itemId, status, durationMs, vocabularyId } = event.payload;
      const { error } = await supabase.from("exercise_results").upsert(
        {
          user_id: event.userId,
          attempt_id: attemptId,
          exercise_id: exerciseId,
          exercise_type: exerciseType,
          item_id: itemId,
          status,
          duration_ms: durationMs,
          vocabulary_id: vocabularyId,
          client_event_id: event.id,
        },
        { onConflict: "user_id, client_event_id" }
      );
      return !error;
    }

    case "settings_changed": {
      const { settings } = event.payload;
      const { error } = await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: event.userId,
            settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      return !error;
    }

    default:
      return false;
  }
}

export function scheduleSync(userId: string, delayMs = 5000): void {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    void processSyncQueue(userId);
  }, delayMs);
}
