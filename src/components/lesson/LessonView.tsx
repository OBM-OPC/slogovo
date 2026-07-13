"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ExerciseResult, Lesson, LessonAttempt } from "@/types";
import { Button } from "@/components/ui/Button";
import { ExerciseEngine } from "@/components/quiz/ExerciseEngine";
import { LessonSummary } from "@/components/lesson/LessonSummary";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { VocabularyList } from "@/components/vocabulary/VocabularyList";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { createActiveTimeTracker } from "@/lib/active-time";
import { getModuleById } from "@/lib/content";
import { createInitialExerciseRuns, createRetryRuns, ExerciseRun } from "@/lib/lesson-flow";
import { createLessonAttempt } from "@/lib/lesson-attempts";
import { useProgressStore } from "@/stores/useProgressStore";
import { durationBucket, trackLearningEvent } from "@/lib/telemetry";

interface LessonViewProps {
  lesson: Lesson;
  moduleId: string;
  nextLessonId: string | null;
  context: { moduleId: string; moduleTitle: string; lessonIndex: number; totalLessons: number } | null;
}

type LessonSection = "intro" | "vocab" | "grammar" | "exercise" | "retry" | "summary";

export function LessonView({ lesson, moduleId, nextLessonId, context }: LessonViewProps) {
  const progress = useProgressSafe();
  const recordLessonAttempt = useProgressStore((state) => state.recordLessonAttempt);
  const moduleMeta = getModuleById(moduleId);
  const requiredScore = moduleMeta?.requiredScore ?? 70;
  const requiresProductive = lesson.requiresProductive ?? moduleMeta?.requiresProductive ?? false;
  const initialRuns = useRef(createInitialExerciseRuns(lesson.exercises));
  const activeTime = useRef(createActiveTimeTracker({ idleThresholdMs: 60_000 }));
  const attemptStartedAt = useRef(new Date().toISOString());
  const lessonStarted = useRef(false);
  const lessonFinished = useRef(false);
  const [section, setSection] = useState<LessonSection>("intro");
  const [runs, setRuns] = useState<ExerciseRun[]>(initialRuns.current);
  const [runIndex, setRunIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [attempt, setAttempt] = useState<LessonAttempt | null>(null);

  const moduleTitle = context?.moduleTitle ?? moduleMeta?.title ?? moduleId;
  const lessonNumber = context?.lessonIndex ?? 0;
  const totalLessons = context?.totalLessons ?? 0;
  const currentRun = runs[runIndex];
  const passedPreviously = progress.completedLessons.includes(lesson.lessonId);

  const interact = () => activeTime.current.recordActivity();

  useEffect(() => {
    const tracker = activeTime.current;
    const startedAt = attemptStartedAt.current;
    const onVisibilityChange = () => {
      if (document.hidden) tracker.pause();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      tracker.pause();
      if (lessonStarted.current && !lessonFinished.current) {
        trackLearningEvent("lesson_abandoned", {
          lessonId: lesson.lessonId,
          moduleId: lesson.moduleId,
          outcome: "abandoned",
          reason: "navigation",
          durationBucket: durationBucket(Date.now() - Date.parse(startedAt)),
        });
      }
    };
  }, [lesson.lessonId, lesson.moduleId]);

  const startLesson = () => {
    interact();
    if (!lessonStarted.current) {
      lessonStarted.current = true;
      trackLearningEvent("lesson_started", { lessonId: lesson.lessonId, moduleId: lesson.moduleId });
    }
    setSection("vocab");
  };

  const finishAttempt = async (finalResults: ExerciseResult[]) => {
    interact();
    const finishedAt = new Date().toISOString();
    const finalAttempt = createLessonAttempt({
      userId: progress.userId,
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      level: lesson.level,
      results: finalResults,
      totalDurationMs: activeTime.current.stop(),
      startedAt: attemptStartedAt.current,
      finishedAt,
      completed: true,
      requiredScore,
      requiresProductive,
      requiredExerciseGroups: lesson.requiredExerciseGroups,
    });
    lessonFinished.current = true;
    trackLearningEvent(finalAttempt.passed ? "lesson_passed" : "lesson_failed", {
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      outcome: finalAttempt.passed ? "passed" : "failed",
      durationBucket: durationBucket(finalAttempt.totalDurationMs),
      count: finalAttempt.itemsAnswered,
    });
    setAttempt(finalAttempt);
    setSection("summary");
    await recordLessonAttempt(finalAttempt, lesson.vocabulary.length);
  };

  const handleExerciseComplete = async (result: ExerciseResult) => {
    interact();
    for (const itemResult of result.itemResults) {
      const properties = {
        lessonId: lesson.lessonId,
        moduleId: lesson.moduleId,
        exerciseId: result.exerciseId,
        itemId: itemResult.itemId,
        vocabularyId: itemResult.vocabularyId,
        outcome: itemResult.isPassing ? "correct" as const : "incorrect" as const,
        durationBucket: durationBucket(itemResult.durationMs),
      };
      trackLearningEvent("exercise_answered", properties);
      if (!itemResult.isPassing) trackLearningEvent("item_failed", properties);
      if (itemResult.isPassing && itemResult.attemptNumber > 1) {
        trackLearningEvent("item_later_corrected", properties);
      }
      if (itemResult.hintsUsed > 0) {
        trackLearningEvent("hint_used", { ...properties, count: itemResult.hintsUsed });
      }
    }
    const finalResults = [...results, result];
    const retryRuns = currentRun ? createRetryRuns(currentRun.exercise, result) : [];
    const nextRuns = retryRuns.length > 0 ? [...runs, ...retryRuns] : runs;
    const nextIndex = runIndex + 1;
    setResults(finalResults);
    setRuns(nextRuns);

    if (nextIndex < nextRuns.length) {
      setRunIndex(nextIndex);
      if (runIndex === initialRuns.current.length - 1 && nextRuns.slice(nextIndex).some((run) => run.retry)) {
        setSection("retry");
      }
      return;
    }
    await finishAttempt(finalResults);
  };

  const sections = ["intro", "vocab", "grammar", "exercise", "summary"] as const;
  const visibleSection = section === "retry" ? "exercise" : section;
  const currentSectionIndex = sections.indexOf(visibleSection);

  return (
    <div className="animate-fade-in px-4 py-6 safe-top">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/kurs/" className="rounded-full bg-gray-100 p-2 text-muted hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{moduleTitle} · Lektion {lessonNumber}/{totalLessons}</p>
          <h1 className="truncate text-xl font-bold">{lesson.title}</h1>
        </div>
      </header>

      <div className="mb-6">
        <ProgressBar value={currentSectionIndex + 1} max={sections.length} />
        <p className="mt-1 text-right text-xs text-muted">Schritt {currentSectionIndex + 1} von {sections.length}</p>
      </div>

      {section === "intro" && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">Einführung</h2>
          <p className="mb-6 text-muted">{lesson.introduction}</p>
          <Button onClick={startLesson} fullWidth>Los geht&apos;s</Button>
        </section>
      )}

      {section === "vocab" && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Neue Vokabeln</h2>
            <span className="text-xs text-muted">{lesson.vocabulary.length} Wörter</span>
          </div>
          <VocabularyList items={lesson.vocabulary} />
          <div className="mt-6"><Button onClick={() => { interact(); setSection("grammar"); }} fullWidth>Weiter zur Grammatik</Button></div>
        </section>
      )}

      {section === "grammar" && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">{lesson.grammar.title}</h2>
          <p className="mb-4 text-muted">{lesson.grammar.explanation}</p>
          <div className="mb-6 space-y-3">
            {lesson.grammar.examples.map((example, index) => (
              <div key={`${example.bg}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-1 text-lg font-medium">{example.bg}</p>
                <p className="text-sm text-muted">{example.de}</p>
                {progress.settings.showLatin && example.bgLatin && <p className="text-xs text-muted">{example.bgLatin}</p>}
                <div className="mt-2"><SpeakButton text={example.bg} progress={progress} variant="inline" label="Anhören" /></div>
              </div>
            ))}
          </div>
          <Button onClick={() => {
            interact();
            if (lesson.exercises.length === 0) void finishAttempt([]);
            else setSection("exercise");
          }} fullWidth>
            {lesson.exercises.length === 0 ? "Ergebnis anzeigen" : "Übungen starten"}
          </Button>
        </section>
      )}

      {section === "exercise" && currentRun && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted">Übung {Math.min(runIndex + 1, initialRuns.current.length)} von {initialRuns.current.length}</span>
            <ProgressBar value={Math.min(runIndex + 1, initialRuns.current.length)} max={initialRuns.current.length} className="w-24" />
          </div>
          <ExerciseEngine
            key={`${currentRun.exercise.id}-${currentRun.attemptNumber}-${runIndex}`}
            exercise={currentRun.exercise}
            attemptNumber={currentRun.attemptNumber}
            onInteraction={interact}
            onComplete={(result) => void handleExerciseComplete(result)}
          />
        </section>
      )}

      {section === "retry" && (
        <section className="card text-center">
          <div className="mb-4 inline-flex rounded-full bg-warm-50 p-4 text-primary"><RotateCcw className="h-8 w-8" /></div>
          <h2 className="mb-2 text-xl font-bold">Fehler wiederholen</h2>
          <p className="mb-6 text-muted">Die fehlgeschlagenen Pflichtaufgaben kommen jetzt noch einmal. Das Abschließen der Bildschirme allein zählt nicht als bestanden.</p>
          <Button onClick={() => { interact(); setSection("exercise"); }} fullWidth>Wiederholung starten</Button>
        </section>
      )}

      {section === "summary" && attempt && (
        <LessonSummary
          attempt={attempt}
          lesson={lesson}
          nextLessonId={nextLessonId}
          passedPreviously={passedPreviously}
          onRetry={() => window.location.reload()}
        />
      )}
    </div>
  );
}
