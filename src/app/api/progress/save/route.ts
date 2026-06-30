import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getSessionFromCookie(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/sb-session=([^;]+)/);
  const sessionCookie = sessionMatch ? decodeURIComponent(sessionMatch[1]) : null;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromCookie(request);
    if (!session?.access_token) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(session.access_token);

    if (userError || !user) {
      return NextResponse.json({ error: "Ungültige Session" }, { status: 401 });
    }

    const body = await request.json();
    const progress = body.progress;

    if (!progress || progress.userId !== user.id) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const { userId, ...rest } = progressToRow(progress);

    const { error } = await supabaseServer
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          ...rest,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Progress save error:", error);
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Progress save error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function progressToRow(progress: any) {
  return {
    userId: progress.userId,
    streak_current: progress.streak?.current ?? 0,
    streak_longest: progress.streak?.longest ?? 0,
    streak_last_study_date: progress.streak?.lastStudyDate ?? null,
    completed_lessons: progress.completedLessons ?? [],
    completed_modules: progress.completedModules ?? [],
    vocabulary_progress: progress.vocabularyProgress ?? {},
    exercise_stats: progress.exerciseStats ?? { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    daily_stats: progress.dailyStats ?? {},
    settings: progress.settings ?? {
      dailyGoal: "medium",
      ttsEnabled: true,
      showLatin: true,
      speechRate: 0.9,
    },
    achievements: progress.achievements ?? [],
  };
}
