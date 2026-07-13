import { getLessonById, getModuleById } from "./content";
import { flattenExerciseResults } from "./evaluation";
import { attemptToDbRow, createLessonAttempt } from "./lesson-attempts";
import type { SyncEvent } from "./sync-queue";

interface DatabaseError {
  message: string;
}

export type SyncDatabaseClient = {
  from: (table: string) => {
    upsert: (
      data: Record<string, unknown>,
      options?: { onConflict?: string }
    ) => Promise<{ error: DatabaseError | null }>;
  };
};

export interface SyncBatchResult {
  processed: string[];
  failed: Array<{ id: string; error: string }>;
}

function authoritativeAttempt(event: Extract<SyncEvent, { type: "lesson_attempt" }>, userId: string) {
  const submitted = event.payload.attempt;
  const lesson = getLessonById(submitted.lessonId);
  if (!lesson) throw new Error(`Unknown lesson '${submitted.lessonId}'`);
  const moduleMeta = getModuleById(lesson.moduleId);
  if (!moduleMeta) throw new Error(`Unknown module '${lesson.moduleId}'`);

  return createLessonAttempt({
    id: submitted.id,
    userId,
    lessonId: lesson.lessonId,
    moduleId: lesson.moduleId,
    level: lesson.level,
    results: submitted.results,
    totalDurationMs: submitted.totalDurationMs,
    startedAt: submitted.startedAt,
    finishedAt: submitted.finishedAt,
    completed: submitted.completed,
    requiredScore: moduleMeta.requiredScore ?? 70,
    requiresProductive: lesson.requiresProductive ?? moduleMeta.requiresProductive,
    requiredExerciseGroups: lesson.requiredExerciseGroups,
  });
}

async function writeEvent(
  client: SyncDatabaseClient,
  userId: string,
  event: SyncEvent
): Promise<void> {
  if (event.userId !== userId) throw new Error("Event user does not match the verified session");

  if (event.type === "vocabulary_review") {
    const { error } = await client.from("vocabulary_review_events").upsert(
      {
        user_id: userId,
        word_id: event.payload.wordId,
        rating: event.payload.rating,
        reviewed_at: event.payload.reviewedAt,
        client_event_id: event.id,
        device_id: event.deviceId,
      },
      { onConflict: "user_id,client_event_id" }
    );
    if (error) throw new Error(error.message);
    return;
  }

  if (event.type === "lesson_attempt") {
    const attempt = authoritativeAttempt(event, userId);
    const { error } = await client.from("lesson_attempts").upsert(
      { ...attemptToDbRow(attempt), client_event_id: event.id, device_id: event.deviceId },
      { onConflict: "user_id,client_event_id" }
    );
    if (error) throw new Error(error.message);

    for (const item of flattenExerciseResults(attempt.results)) {
      const { error: itemError } = await client.from("exercise_results").upsert(
        {
          user_id: userId,
          attempt_id: attempt.id,
          exercise_id: item.exerciseId,
          exercise_type: item.exerciseType,
          item_id: item.itemId,
          status: item.status,
          is_passing: item.isPassing,
          user_answer: item.userAnswer,
          correct_answers: item.acceptedAnswers,
          feedback: item.feedback,
          feedback_needs_review: item.feedbackNeedsReview ?? false,
          duration_ms: item.durationMs,
          answered_at: item.completedAt,
          vocabulary_id: item.vocabularyId,
          client_event_id: `${event.id}:${item.id}`,
          device_id: event.deviceId,
        },
        { onConflict: "user_id,client_event_id" }
      );
      if (itemError) throw new Error(itemError.message);
    }
    return;
  }

  if (event.type === "exercise_result") {
    const { error } = await client.from("exercise_results").upsert(
      {
        user_id: userId,
        attempt_id: event.payload.attemptId,
        exercise_id: event.payload.exerciseId,
        exercise_type: event.payload.exerciseType,
        item_id: event.payload.itemId,
        status: event.payload.status,
        is_passing: event.payload.status === "correct" || event.payload.status === "typo",
        duration_ms: event.payload.durationMs,
        vocabulary_id: event.payload.vocabularyId,
        client_event_id: event.id,
        device_id: event.deviceId,
      },
      { onConflict: "user_id,client_event_id" }
    );
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("user_progress").upsert(
    {
      user_id: userId,
      settings: event.payload.settings,
      updated_at: event.timestamp,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
}

export async function persistSyncEvents(
  client: SyncDatabaseClient,
  userId: string,
  events: SyncEvent[]
): Promise<SyncBatchResult> {
  const result: SyncBatchResult = { processed: [], failed: [] };
  for (const event of events) {
    try {
      await writeEvent(client, userId, event);
      result.processed.push(event.id);
    } catch (error) {
      result.failed.push({
        id: event.id,
        error: error instanceof Error ? error.message : "Unknown sync error",
      });
    }
  }
  return result;
}
