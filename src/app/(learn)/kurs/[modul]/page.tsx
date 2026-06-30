"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useProgressStore } from "@/stores/useProgressStore";
import { getLessonsByModule, getModuleById } from "@/lib/content";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModulePage() {
  const params = useParams();
  const moduleId = params.modul as string;
  const progress = useProgressStore((state) => state.progress);
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
    <main className="animate-fade-in px-4 py-6 safe-top">
      <Link href="/lernen" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <span className="mb-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
        {moduleMeta.level}
      </span>
      <h1 className="mb-1 text-2xl font-bold">{moduleMeta.title}</h1>
      <p className="mb-4 text-sm text-muted">{moduleMeta.description}</p>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{completedCount}/{lessons.length} Lektionen</span>
          <span>{Math.round((completedCount / lessons.length) * 100)}%</span>
        </div>
        <ProgressBar value={completedCount} max={lessons.length} />
      </div>

      <ul className="space-y-2">
        {lessons.map((lesson) => {
          const isCompleted = progress.completedLessons.includes(lesson.lessonId);
          const isNext = !isCompleted && lessons
            .filter((l) => !progress.completedLessons.includes(l.lessonId))[0]?.lessonId === lesson.lessonId;

          return (
            <li key={lesson.lessonId}>
              <Link
                href={`/kurs/${moduleId}/${lesson.lessonId}/`}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-colors",
                  isCompleted && "bg-primary-50",
                  isNext && "bg-orange-50 ring-1 ring-orange-200",
                  !isCompleted && !isNext && "bg-gray-50 hover:bg-primary-50"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : isNext ? (
                  <Circle className="h-5 w-5 text-orange-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted" />
                )}
                <div className="flex-1">
                  <p className={cn("font-medium", isNext && "text-orange-700")}>{lesson.title}</p>
                  <p className="text-xs text-muted">{lesson.duration}</p>
                </div>
                {isNext && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                    Weiter
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
