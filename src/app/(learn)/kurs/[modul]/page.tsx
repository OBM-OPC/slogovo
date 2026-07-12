"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getLessonsByModule, getModuleById } from "@/lib/content";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle2, Circle, ArrowLeft, ChevronRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModulePage() {
  const params = useParams<{ modul: string }>();
  const moduleId = params?.modul;
  const progress = useProgressSafe();

  if (!moduleId) {
    return (
      <main className="px-4 py-6">
        <p className="text-muted">Modul nicht gefunden.</p>
      </main>
    );
  }

  const moduleMeta = getModuleById(moduleId);
  const lessons = getLessonsByModule(moduleId);

  if (!moduleMeta) {
    return (
      <main className="px-4 py-6">
        <p className="text-muted">Modul nicht gefunden.</p>
      </main>
    );
  }

  const completedCount = lessons.filter((l) =>
    progress.completedLessons.includes(l.lessonId)
  ).length;

  return (
    <main className="animate-fade-in bg-rose-pattern min-h-screen px-4 py-6 safe-top">
      <Link href="/lernen" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <div className="mb-6">
        <span className={cn(
          "mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-white",
          moduleMeta.level === "A1" ? "bg-primary" : "bg-accent"
        )}>
          {moduleMeta.level}
        </span>
        <h1 className="text-2xl font-serif font-bold">{moduleMeta.title}</h1>
        <p className="mt-1 text-sm text-muted">{moduleMeta.description}</p>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">{completedCount}/{lessons.length} Lektionen</span>
          <span className="text-muted">{Math.round((completedCount / lessons.length) * 100)}%</span>
        </div>
        <ProgressBar value={completedCount} max={lessons.length} />
      </div>

      {/* Lessons */}
      <ul className="space-y-2">
        {lessons.map((lesson) => {
          const isCompleted = progress.completedLessons.includes(lesson.lessonId);
          const isMastered = progress.masteredLessons.includes(lesson.lessonId);
          const isNext = !isCompleted && lessons
            .filter((l) => !progress.completedLessons.includes(l.lessonId))[0]?.lessonId === lesson.lessonId;

          return (
            <li key={lesson.lessonId}>
              <Link
                href={`/kurs/${moduleId}/${lesson.lessonId}/`}
                className={cn(
                  "group flex items-center gap-4 rounded-3xl p-4 transition-all duration-200",
                  isMastered && "bg-success/10 shadow-sm ring-1 ring-success/30",
                  isCompleted && !isMastered && "bg-primary-50/50 shadow-sm",
                  isNext && "bg-white shadow-card ring-1 ring-gold/30",
                  !isCompleted && !isNext && "bg-white shadow-card hover:shadow-card-hover"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
                  isMastered ? "bg-success-50" : isCompleted ? "bg-primary-50" : isNext ? "bg-gold-50" : "bg-warm-50"
                )}>
                  {isMastered ? (
                    <Award className="h-5 w-5 text-success" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : isNext ? (
                    <Circle className="h-5 w-5 text-gold" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-serif font-bold",
                    isNext && "text-gold-700"
                  )}>{lesson.title}</p>
                  <p className="text-xs text-muted">
                    {lesson.duration}
                    {isMastered && " · gemeistert"}
                    {isCompleted && !isMastered && " · abgeschlossen"}
                  </p>
                </div>
                {isNext && (
                  <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700">
                    Weiter
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-warm-300 group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
