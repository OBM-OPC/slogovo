"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ChevronDown, Circle, Clock3, Lock, Map, Play, Trophy } from "lucide-react";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllModules } from "@/lib/content";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ModuleMeta, UserProgress } from "@/types";

type ChapterState = "completed" | "current" | "locked" | "available";

interface ChapterView {
  module: ModuleMeta;
  state: ChapterState;
  completedCount: number;
  total: number;
  progressPercent: number;
  totalMinutes: number;
}

export function buildCourseRoadmap(modules: ModuleMeta[], progress: UserProgress): ChapterView[] {
  const ordered = [...modules].sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);
  let foundCurrent = false;

  return ordered.map((module, index) => {
    const completedCount = module.lessons.filter((lesson) => progress.completedLessons.includes(lesson.lessonId)).length;
    const completed = completedCount === module.lessons.length && module.lessons.length > 0;
    const previous = ordered[index - 1];
    const previousCompleted = !previous || previous.lessons.every((lesson) => progress.completedLessons.includes(lesson.lessonId));
    const unlocked = index === 0 || previousCompleted || progress.completedModules.includes(previous?.moduleId ?? "");
    const current = unlocked && !completed && !foundCurrent;
    if (current) foundCurrent = true;
    const state: ChapterState = completed ? "completed" : current ? "current" : unlocked ? "available" : "locked";

    return {
      module,
      state,
      completedCount,
      total: module.lessons.length,
      progressPercent: module.lessons.length === 0 ? 0 : Math.round((completedCount / module.lessons.length) * 100),
      totalMinutes: module.lessons.reduce((sum, lesson) => sum + (Number.parseInt(lesson.duration, 10) || 0), 0),
    };
  });
}

export default function CoursePage() {
  const progress = useProgressSafe();
  return <CourseRoadmap modules={getAllModules()} progress={progress} />;
}

export function CourseRoadmap({ modules, progress }: { modules: ModuleMeta[]; progress: UserProgress }) {
  const chapters = buildCourseRoadmap(modules, progress);
  const completedLessons = chapters.reduce((sum, chapter) => sum + chapter.completedCount, 0);
  const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.total, 0);
  const overallProgress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  const levels = [...new Set(chapters.map((chapter) => chapter.module.level))];

  return (
    <main className="min-h-screen bg-rose-pattern px-4 py-6 safe-top pb-28 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Map className="h-4 w-4" aria-hidden="true" /> Dein Lernpfad</p>
            <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Schritt für Schritt Bulgarisch</h1>
            <p className="mt-2 max-w-xl leading-7 text-muted">Jedes Kapitel baut auf dem vorherigen auf. Öffne ein Kapitel, um Ziele und Lektionen zu sehen.</p>
          </div>
          <div className="mt-5 min-w-44 rounded-2xl bg-white/90 p-4 shadow-card sm:mt-0">
            <div className="flex justify-between text-sm"><span className="font-semibold">Gesamtfortschritt</span><span>{overallProgress} %</span></div>
            <ProgressBar className="mt-2" value={completedLessons} max={totalLessons || 1} ariaLabel={`${completedLessons} von ${totalLessons} Lektionen abgeschlossen`} />
            <p className="mt-2 text-xs text-muted">{completedLessons} von {totalLessons} Lektionen</p>
          </div>
        </header>

        {levels.map((level) => (
          <section key={level} aria-labelledby={`level-${level}`} className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span id={`level-${level}`} className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-white">Niveau {level}</span>
              <span className="h-px flex-1 bg-warm-200" aria-hidden="true" />
            </div>
            <ol className="relative ml-3 space-y-5 border-l-2 border-dashed border-primary-200 pl-7 sm:ml-5 sm:pl-10">
              {chapters.filter((chapter) => chapter.module.level === level).map((chapter, index) => (
                <li key={chapter.module.moduleId} className="relative">
                  <span className={cn(
                    "absolute -left-[2.72rem] top-6 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-xs font-bold sm:-left-[3.55rem]",
                    chapter.state === "completed" && "border-success bg-success text-white",
                    chapter.state === "current" && "border-gold bg-gold-50 text-gold-700 shadow-[0_0_0_5px_rgba(232,166,42,0.14)] motion-safe:animate-pulse",
                    chapter.state === "locked" && "border-warm-200 bg-warm-100 text-muted",
                    chapter.state === "available" && "border-primary text-primary"
                  )} aria-hidden="true">
                    {chapter.state === "completed" ? <Check className="h-4 w-4" /> : chapter.state === "locked" ? <Lock className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <ChapterCard chapter={chapter} progress={progress} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}

function ChapterCard({ chapter, progress }: { chapter: ChapterView; progress: UserProgress }) {
  const [expanded, setExpanded] = useState(chapter.state === "current");
  const { module, state } = chapter;
  const isLocked = state === "locked";
  const isComplete = state === "completed";

  return (
    <Card className={cn(
      "overflow-hidden p-0 transition-[box-shadow,border-color]",
      state === "current" && "border-gold-300 shadow-card-hover",
      isLocked && "border-warm-200 bg-warm-50/90 text-muted"
    )}>
      <button
        type="button"
        className="flex min-h-24 w-full items-start gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        aria-expanded={expanded}
        aria-controls={`chapter-${module.moduleId}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isComplete ? "success" : state === "current" ? "warning" : "neutral"}>{isComplete ? "Abgeschlossen" : state === "current" ? "Jetzt lernen" : isLocked ? "Gesperrt" : "Verfügbar"}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> ca. {chapter.totalMinutes} Min.</span>
          </div>
          <h2 className="mt-2 font-serif text-xl font-bold text-foreground">{module.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{module.description}</p>
        </div>
        <ChevronDown className={cn("mt-2 h-5 w-5 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
      </button>

      <div className="px-5 pb-5">
        <div className="mb-1.5 flex justify-between text-xs font-medium"><span>{chapter.completedCount}/{chapter.total} Lektionen</span><span>{chapter.progressPercent} %</span></div>
        <ProgressBar value={chapter.completedCount} max={chapter.total || 1} ariaLabel={`Kapitel ${module.title}: ${chapter.progressPercent} Prozent abgeschlossen`} barClassName={isComplete ? "bg-success" : state === "current" ? "bg-gold" : undefined} />
      </div>

      {expanded && (
        <div id={`chapter-${module.moduleId}`} className="border-t border-warm-200 bg-white/70 px-5 py-5">
          <div className="mb-5 rounded-2xl bg-primary-50 p-4">
            <h3 className="text-sm font-bold text-primary">Das lernst du</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{module.description}</p>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {module.lessons.slice(0, 4).map((lesson) => <li key={lesson.lessonId} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /><span>{lesson.title}</span></li>)}
            </ul>
          </div>

          <ol className="space-y-2">
            {module.lessons.map((lesson) => {
              const completed = progress.completedLessons.includes(lesson.lessonId);
              const current = state === "current" && !completed && module.lessons.find((item) => !progress.completedLessons.includes(item.lessonId))?.lessonId === lesson.lessonId;
              return (
                <li key={lesson.lessonId}>
                  {isLocked ? (
                    <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-warm-100 px-4 py-3 text-muted" aria-label={`${lesson.title}, gesperrt`}>
                      <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <LessonCopy title={lesson.title} duration={lesson.duration} />
                    </div>
                  ) : (
                    <Link href={`/kurs/${module.moduleId}/${lesson.lessonId}/`} className={cn(
                      "group flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                      completed && "border-success/30 bg-success/5",
                      current && "border-gold-300 bg-gold-50 shadow-sm motion-safe:animate-pulse",
                      !completed && !current && "border-warm-200 hover:border-primary-200 hover:bg-primary-50"
                    )}>
                      {completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Abgeschlossen" /> : current ? <Play className="h-5 w-5 shrink-0 fill-gold text-gold" aria-label="Aktuelle Lektion" /> : <Circle className="h-5 w-5 shrink-0 text-warm-300" aria-hidden="true" />}
                      <LessonCopy title={lesson.title} duration={lesson.duration} />
                      {current && <span className="rounded-full bg-gold-100 px-2 py-1 text-xs font-bold text-gold-800">Weiter</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>

          {isComplete && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success"><Trophy className="h-5 w-5" aria-hidden="true" /> Kapitel erfolgreich abgeschlossen</p>}
          {isLocked && <p className="mt-4 text-sm text-muted">Schließe das vorherige Kapitel ab, um diese Lektionen freizuschalten.</p>}
        </div>
      )}
    </Card>
  );
}

function LessonCopy({ title, duration }: { title: string; duration: string }) {
  return <div className="min-w-0 flex-1"><p className="font-semibold text-foreground">{title}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Clock3 className="h-3 w-3" aria-hidden="true" /> {duration}</p></div>;
}
