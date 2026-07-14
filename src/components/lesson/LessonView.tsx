"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, RotateCcw, X } from "lucide-react";
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
  const [itemProgress, setItemProgress] = useState({ index: 0, total: 1 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const reviewItemIds = useRef(new Set<string>());

  const moduleTitle = context?.moduleTitle ?? moduleMeta?.title ?? moduleId;
  const lessonNumber = context?.lessonIndex ?? 0;
  const totalLessons = context?.totalLessons ?? 0;
  const currentRun = runs[runIndex];
  const passedPreviously = progress.completedLessons.includes(lesson.lessonId);
  const estimatedSeconds = (Number.parseInt(lesson.duration, 10) || 10) * 60;

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

  useEffect(() => {
    if (section === "intro" || section === "summary") return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [section]);

  useEffect(() => {
    if (section === "intro") return;
    const focusTimer = window.setTimeout(() => stageRef.current?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(focusTimer);
  }, [itemProgress.index, runIndex, section]);

  const handleItemChange = useCallback((index: number, total: number) => {
    setItemProgress((current) => current.index === index && current.total === total ? current : { index, total });
  }, []);

  const handleReviewRequest = useCallback((itemId: string) => {
    reviewItemIds.current.add(itemId);
  }, []);

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
    const resultWithReview = {
      ...result,
      itemResults: result.itemResults.map((itemResult) => reviewItemIds.current.has(itemResult.itemId)
        ? { ...itemResult, required: true }
        : itemResult),
    };
    for (const itemResult of resultWithReview.itemResults) {
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
    const finalResults = [...results, resultWithReview];
    const retryRuns = currentRun ? createRetryRuns(currentRun.exercise, resultWithReview) : [];
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
  const exerciseTotal = runs.reduce((sum, run) => sum + run.exercise.data.length, 0);
  const exerciseOffset = runs.slice(0, runIndex).reduce((sum, run) => sum + run.exercise.data.length, 0);
  const currentQuestion = Math.min(exerciseTotal, exerciseOffset + itemProgress.index + 1);
  const journeyTotal = 3 + Math.max(1, exerciseTotal) + 1;
  const journeyCurrent = section === "intro" ? 1
    : section === "vocab" ? 2
      : section === "grammar" ? 3
        : section === "summary" ? journeyTotal
          : 3 + currentQuestion;
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-rose-pattern px-4 pb-28 safe-top sm:py-6">
      <div className="sticky top-0 z-30 -mx-4 border-b border-warm-200/80 bg-background/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:shadow-sm">
        <header className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/kurs/" aria-label="Zurück zum Lernpfad" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warm-100 text-muted hover:bg-warm-200">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted">{moduleTitle} · Lektion {lessonNumber}/{totalLessons}</p>
            <h1 className="truncate font-serif text-lg font-bold sm:text-xl">{lesson.title}</h1>
          </div>
          {showTimer ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-warm-100 px-2 py-1 text-xs font-semibold text-muted" title={`Noch ungefähr ${formatTime(Math.max(0, estimatedSeconds - elapsedSeconds))}`}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span aria-label={`${formatTime(elapsedSeconds)} Lernzeit`}>{formatTime(elapsedSeconds)}</span>
              <button type="button" onClick={() => setShowTimer(false)} aria-label="Lektionstimer ausblenden" className="ml-1 rounded-full p-1 hover:bg-warm-200"><X className="h-3 w-3" aria-hidden="true" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowTimer(true)} className="flex min-h-11 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted" aria-label="Lektionstimer anzeigen"><Clock3 className="h-4 w-4" aria-hidden="true" /></button>
          )}
        </header>
        <div className="mx-auto mt-3 max-w-3xl">
          <ProgressBar value={journeyCurrent} max={journeyTotal} ariaLabel={`Lektionsfortschritt: ${journeyCurrent} von ${journeyTotal}`} />
          <div className="mt-1.5 flex justify-between text-xs text-muted">
            <span>{section === "exercise" || section === "retry" ? `Frage ${currentQuestion} von ${exerciseTotal}` : `Schritt ${currentSectionIndex + 1} von ${sections.length}`}</span>
            <span>Noch ca. {formatTime(Math.max(0, estimatedSeconds - elapsedSeconds))}</span>
          </div>
        </div>
      </div>

      <div ref={stageRef} tabIndex={-1} aria-label="Aktueller Lektionsschritt" className="lesson-step mx-auto mt-6 min-h-[32rem] max-w-3xl focus:outline-none">

      {section === "intro" && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">Einführung</h2>
          <p className="mb-6 text-muted">{lesson.introduction}</p>
          <Button className="lesson-action" onClick={startLesson} fullWidth>Los geht&apos;s</Button>
        </section>
      )}

      {section === "vocab" && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Neue Vokabeln</h2>
            <span className="text-xs text-muted">{lesson.vocabulary.length} Wörter</span>
          </div>
          <VocabularyList items={lesson.vocabulary} />
          <div className="mt-6"><Button className="lesson-action" onClick={() => { interact(); setSection("grammar"); }} fullWidth>Weiter zur Grammatik</Button></div>
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
          <Button className="lesson-action" onClick={() => {
            interact();
            if (lesson.exercises.length === 0) void finishAttempt([]);
            else setSection("exercise");
          }} fullWidth>
            {lesson.exercises.length === 0 ? "Ergebnis anzeigen" : "Übungen starten"}
          </Button>
        </section>
      )}

      {section === "exercise" && currentRun && (
        <section className="card [&_button]:min-h-14">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted">Übung {Math.min(runIndex + 1, initialRuns.current.length)} von {initialRuns.current.length}</span>
            <ProgressBar value={Math.min(runIndex + 1, initialRuns.current.length)} max={initialRuns.current.length} className="w-24" />
          </div>
          <ExerciseEngine
            key={`${currentRun.exercise.id}-${currentRun.attemptNumber}-${runIndex}`}
            exercise={currentRun.exercise}
            attemptNumber={currentRun.attemptNumber}
            onInteraction={interact}
            onItemChange={handleItemChange}
            onReviewRequest={handleReviewRequest}
            onComplete={(result) => void handleExerciseComplete(result)}
          />
        </section>
      )}

      {section === "retry" && (
        <section className="card text-center">
          <div className="mb-4 inline-flex rounded-full bg-warm-50 p-4 text-primary"><RotateCcw className="h-8 w-8" /></div>
          <h2 className="mb-2 text-xl font-bold">Fehler wiederholen</h2>
          <p className="mb-6 text-muted">Die fehlgeschlagenen Pflichtaufgaben kommen jetzt noch einmal. Das Abschließen der Bildschirme allein zählt nicht als bestanden.</p>
          <Button className="lesson-action" onClick={() => { interact(); setSection("exercise"); }} fullWidth>Wiederholung starten</Button>
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
    </div>
  );
}
