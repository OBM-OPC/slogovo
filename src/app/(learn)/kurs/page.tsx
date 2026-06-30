"use client";

import Link from "next/link";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllModules, getLessonsByModule } from "@/lib/content";
import { ModuleMeta } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function ModuleCard({ module, isUnlocked, nextLessonId }: { module: ModuleMeta; isUnlocked: boolean; nextLessonId?: string }) {
  const progress = useProgressSafe();
  const lessons = getLessonsByModule(module.moduleId);
  const completedCount = lessons.filter((l) =>
    progress.completedLessons.includes(l.lessonId)
  ).length;
  const total = lessons.length;

  return (
    <div
      className={cn(
        "card mb-4",
        !isUnlocked && "opacity-75"
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <span className="mb-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
            {module.level}
          </span>
          <h2 className="text-lg font-bold">{module.title}</h2>
          <p className="text-sm text-muted">{module.description}</p>
        </div>
        {!isUnlocked && (
          <div className="rounded-full bg-gray-100 p-2 text-muted">
            <Lock className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{completedCount}/{total} Lektionen</span>
          <span>{Math.round((completedCount / total) * 100)}%</span>
        </div>
        <ProgressBar value={completedCount} max={total} />
      </div>

      <ul className="space-y-2">
        {module.lessons.map((lesson) => {
          const isCompleted = progress.completedLessons.includes(lesson.lessonId);
          const isCurrent = nextLessonId === lesson.lessonId;
          const canAccess = isUnlocked;
          return (
            <li key={lesson.lessonId}>
              {canAccess ? (
                <Link
                  href={`/kurs/${module.moduleId}/${lesson.lessonId}/`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 transition-colors",
                    isCompleted && "bg-primary-50",
                    isCurrent && !isCompleted && "bg-orange-50 ring-1 ring-orange-200",
                    !isCompleted && !isCurrent && "bg-gray-50 hover:bg-primary-50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : isCurrent ? (
                    <Circle className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted" />
                  )}
                  <div className="flex-1">
                    <p className={cn("font-medium", isCurrent && "text-orange-700")}>{lesson.title}</p>
                    <p className="text-xs text-muted">{lesson.duration}</p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                      Weiter
                    </span>
                  )}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-gray-100 p-3 opacity-60">
                  <Lock className="h-5 w-5 text-muted" />
                  <div className="flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-muted">{lesson.duration}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CoursePage() {
  const progress = useProgressSafe();
  const modules = getAllModules().sort((a, b) => a.order - b.order);

  // Group modules by level
  const modulesByLevel = modules.reduce<Record<string, ModuleMeta[]>>((acc, m) => {
    if (!acc[m.level]) acc[m.level] = [];
    acc[m.level].push(m);
    return acc;
  }, {});
  const levels = Object.keys(modulesByLevel).sort(); // A1, A2, B1...

  const allLessons = modules
    .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.moduleId })));
  const nextLesson = allLessons.find(
    (l) => !progress.completedLessons.includes(l.lessonId)
  );

  // Compute flat index for unlock logic
  let flatIndex = 0;
  const moduleUnlockMap: Record<string, boolean> = {};
  const flatModules: ModuleMeta[] = [];
  for (const level of levels) {
    for (const m of modulesByLevel[level]) {
      flatModules.push(m);
      const prev = flatModules[flatIndex - 1];
      moduleUnlockMap[m.moduleId] =
        flatIndex === 0 ||
        !prev ||
        progress.completedModules.includes(prev.moduleId);
      flatIndex++;
    }
  }

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Kursstruktur</h1>
      <p className="mb-6 text-muted">Arbeite die Module der Reihe nach ab.</p>

      {levels.map((level) => (
        <div key={level} className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-white">
              {level}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {modulesByLevel[level].map((module) => (
            <ModuleCard
              key={module.moduleId}
              module={module}
              isUnlocked={moduleUnlockMap[module.moduleId]}
              nextLessonId={nextLesson?.lessonId}
            />
          ))}
        </div>
      ))}
    </main>
  );
}
