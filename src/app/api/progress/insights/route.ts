import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbRowToAttempt } from "@/lib/lesson-attempts";
import { firstItemAttempts } from "@/lib/evaluation";
import type { AttemptSkillSummary, ProgressAttemptSummary } from "@/lib/progress-insights";
import { buildProgressInsights } from "@/lib/progress-insights";
import { logEvent } from "@/lib/structured-log";
import type { ExerciseType } from "@/types";
import { rowToProgress } from "@/lib/progress-serialization";
import { createDefaultProgress } from "@/lib/progress-db";
import { buildAuthoritativeProgress, type AuthoritativeReviewRow } from "@/lib/authoritative-progress";
import { getAllModules, getLessonsByModule } from "@/lib/content";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const [attemptResult, progressResult, reviewResult] = await Promise.all([
    supabase
      .from("lesson_attempts")
      .select("id,user_id,lesson_id,module_id,level,results,total_duration_ms,active_time_seconds,started_at,finished_at,first_try_correct,items_answered,correct_count,incorrect_count,required_score,passed,mastered,completed,accuracy,score,xp_earned")
      .eq("user_id", user.id)
      .order("finished_at", { ascending: false })
      .limit(10_000),
    supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("vocabulary_review_events")
      .select("word_id,rating,practice_mode,reviewed_at,response_time_ms,error_category")
      .eq("user_id", user.id)
      .order("reviewed_at", { ascending: true })
      .limit(100_000),
  ]);

  if (attemptResult.error || progressResult.error || reviewResult.error) {
    logEvent("database_error", { errorCode: "DATABASE_READ_FAILED", operation: "progress_insights" });
    return NextResponse.json({ error: "Fortschrittsdetails konnten nicht geladen werden" }, { status: 500 });
  }

  const attempts: ProgressAttemptSummary[] = (attemptResult.data ?? []).map((row) => {
    const attempt = dbRowToAttempt(row as Record<string, unknown>);
    const totals = new Map<ExerciseType, AttemptSkillSummary>();
    for (const item of firstItemAttempts(attempt.results)) {
      const current = totals.get(item.exerciseType) ?? { exerciseType: item.exerciseType, correct: 0, total: 0 };
      current.total += 1;
      if (item.isPassing) current.correct += 1;
      totals.set(item.exerciseType, current);
    }
    return { score: attempt.score, finishedAt: attempt.finishedAt, skills: [...totals.values()] };
  });

  const progress = rowToProgress(progressResult.data, user.id) ?? createDefaultProgress(user.id);
  const today = todayISO();
  const reviewRows = (reviewResult.data ?? []) as unknown as AuthoritativeReviewRow[];
  const beforeToday = buildAuthoritativeProgress(
    user.id,
    [],
    reviewRows.filter((review) => review.reviewed_at.slice(0, 10) < today),
    progress.settings
  );
  const dueAtStartIds = new Set(Object.entries(beforeToday.vocabularyProgress)
    .filter(([, item]) => !item.nextReview || item.nextReview <= today)
    .map(([wordId]) => wordId));
  const reviewedTodayIds = new Set(reviewRows
    .filter((review) => review.reviewed_at.slice(0, 10) === today)
    .map((review) => review.word_id));
  const completedDue = [...dueAtStartIds].filter((wordId) => reviewedTodayIds.has(wordId)).length;
  const grammarLessons = getAllModules().flatMap((module) => getLessonsByModule(module.moduleId).map((lesson) => ({ lessonId: lesson.lessonId, title: lesson.grammar.title })));
  const insights = buildProgressInsights(progress, attempts, grammarLessons, today, { dueAtStart: dueAtStartIds.size, completedDue });

  return NextResponse.json(
    { insights },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
