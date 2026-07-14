import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbRowToAttempt } from "@/lib/lesson-attempts";
import { firstItemAttempts } from "@/lib/evaluation";
import type { AttemptSkillSummary, ProgressAttemptSummary } from "@/lib/progress-insights";
import { logEvent } from "@/lib/structured-log";
import type { ExerciseType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { data, error } = await supabase
    .from("lesson_attempts")
    .select("id,user_id,lesson_id,module_id,level,results,total_duration_ms,active_time_seconds,started_at,finished_at,first_try_correct,items_answered,correct_count,incorrect_count,required_score,passed,mastered,completed,accuracy,score,xp_earned")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(100);

  if (error) {
    logEvent("database_error", { errorCode: "DATABASE_READ_FAILED", operation: "progress_insights" });
    return NextResponse.json({ error: "Fortschrittsdetails konnten nicht geladen werden" }, { status: 500 });
  }

  const attempts: ProgressAttemptSummary[] = (data ?? []).map((row) => {
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

  return NextResponse.json({ attempts });
}
