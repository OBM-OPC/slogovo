import type { UserProgress } from "@/types";
import { buildAuthoritativeProgress, type AuthoritativeAttemptRow, type AuthoritativeReviewRow } from "./authoritative-progress";
import { progressToRow, rowToProgress } from "./progress-serialization";

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface SelectQuery<T> extends PromiseLike<QueryResult<T[]>> {
  eq(column: string, value: string): SelectQuery<T>;
  order(column: string, options: { ascending: boolean }): SelectQuery<T>;
  limit(count: number): SelectQuery<T>;
}

interface MaybeSingleQuery<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: string): MaybeSingleQuery<T>;
  maybeSingle(): PromiseLike<QueryResult<T>>;
}

interface AuthoritativeProgressClient {
  from(table: string): {
    select(columns: string): unknown;
    upsert(
      value: Record<string, unknown>,
      options: { onConflict: string }
    ): PromiseLike<QueryResult<never>>;
  };
}

export async function rebuildAuthoritativeProgress(clientValue: unknown, userId: string): Promise<UserProgress> {
  const client = clientValue as AuthoritativeProgressClient;
  const attemptsQuery = client.from("lesson_attempts")
    .select("id,lesson_id,module_id,active_time_seconds,finished_at,items_answered,correct_count,incorrect_count,passed,mastered,score") as SelectQuery<Record<string, unknown>>;
  const reviewsQuery = client.from("vocabulary_review_events")
    .select("word_id,rating,practice_mode,reviewed_at,response_time_ms,error_category") as SelectQuery<Record<string, unknown>>;
  const existingQuery = client.from("user_progress")
    .select("*") as MaybeSingleQuery<Record<string, unknown>>;
  const [attemptResult, reviewResult, existingResult] = await Promise.all([
    attemptsQuery
      .eq("user_id", userId)
      .order("finished_at", { ascending: true })
      .limit(10_000),
    reviewsQuery
      .eq("user_id", userId)
      .order("reviewed_at", { ascending: true })
      .limit(100_000),
    existingQuery
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  for (const result of [attemptResult, reviewResult, existingResult]) {
    if (result.error) throw new Error(result.error.message);
  }
  const existing = rowToProgress(existingResult.data, userId);
  const settings = existing?.settings ?? {
    dailyGoal: "medium" as const,
    ttsEnabled: true,
    showLatin: true,
    speechRate: 0.9,
    onboarding: {
      completed: false,
      knowsCyrillic: false,
      priorBulgarian: "none" as const,
      knowsSlavicLanguage: false,
      learningGoal: "travel" as const,
      recommendedPath: "alphabet" as const,
    },
  };
  const progress = buildAuthoritativeProgress(
    userId,
    (attemptResult.data ?? []) as unknown as AuthoritativeAttemptRow[],
    (reviewResult.data ?? []) as unknown as AuthoritativeReviewRow[],
    settings
  );
  const { error } = await client.from("user_progress").upsert(
    { ...progressToRow(progress), updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
  return progress;
}
