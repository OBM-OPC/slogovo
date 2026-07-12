"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lesson } from "@/types";
import { ExerciseResult } from "@/types/learning";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { VocabularyList } from "@/components/vocabulary/VocabularyList";
import { ExerciseEngine } from "@/components/quiz/ExerciseEngine";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModuleById } from "@/lib/content";
import { buildExerciseResult, calculateLessonMetrics } from "@/lib/evaluation";
import { evaluateLessonGate } from "@/lib/lesson-gate";
import { buildLessonPerformanceSummary } from "@/lib/lesson-summary";
import { createActiveTimeTracker, msToRoundedMinutes } from "@/lib/active-time";

interface LessonViewProps {
  lesson: Lesson;
  moduleId: string;
  nextLessonId: string | null;
  context: { moduleId: string; moduleTitle: string; lessonIndex: number; totalLessons: number } | null;
}

export function LessonView({ lesson, moduleId, nextLessonId, context }: LessonViewProps) {
  const progress = useProgressSafe();
  const completeLesson = useProgressStore((state) => state.completeLesson);
  const masterLesson = useProgressStore((state) => state.masterLesson);
  const addStudyTime = useProgressStore((state) => state.addStudyTime);

  const [section, setSection] = useState<"intro" | "vocab" | "grammar" | "exercise" | "summary">("intro");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [retrying, setRetrying] = useState(false);
  const activeTimeTracker = useMemo(() => createActiveTimeTracker(), []);
  const isCompleted = progress.completedLessons.includes(lesson.lessonId);
  const isMastered = progress.masteredLessons.includes(lesson.lessonId);

  const moduleTitle = context?.moduleTitle ?? getModuleById(moduleId)?.title ?? moduleId;
  const lessonNumber = context?.lessonIndex ?? 0;
  const totalLessons = context?.totalLessons ?? 0;

  const gate = useMemo(() => evaluateLessonGate(results), [results]);
  const summary = useMemo(() => {
    if (results.length === 0) return null;
    const metrics = calculateLessonMetrics(results);
    return buildLessonPerformanceSummary({
      id: crypto.randomUUID(),
      userId: progress.userId,
      lessonId: lesson.lessonId,
      moduleId,
      level: lesson.level,
      results,
      totalDurationMs: activeTimeTracker.getTotalMs(),
      startedAt: new Date().toISOString(),
      completed: true,
      passed: gate.passed,
      accuracy: metrics.accuracy,
      score: metrics.score,
      firstTryCorrect: metrics.firstTryCorrect,
      itemsAnswered: metrics.itemsAnswered,
      xpEarned: gate.passed ? Math.max(10, Math.round(metrics.score * 0.5)) : 0,
    });
  }, [results, gate.passed, activeTimeTracker, lesson, moduleId, progress.userId]);

  const markLessonComplete = async () => {
    if (isCompleted) return;
    await completeLesson(lesson.lessonId);
    if (summary) {
      await addStudyTime(msToRoundedMinutes(summary.totalDurationMs), lesson.vocabulary.length);
    }
    if (gate.passed) {
      await masterLesson(lesson.lessonId, Math.round(gate.accuracy * 100));
    }
  };

  const handleExerciseComplete = async (correct: boolean) => {
    const exercise = lesson.exercises[exerciseIndex];
    const result = buildExerciseResult({
      exerciseId: exercise.id,
      exerciseType: exercise.type,
      itemId: `${exercise.id}-item-0`,
      userAnswer: correct ? "__correct__" : "__wrong__",
      acceptedAnswers: ["__correct__"],
      durationMs: 0,
    });
    const nextResults = [...results, result];
    setResults(nextResults);

    if (exerciseIndex < lesson.exercises.length - 1) {
      setExerciseIndex((prev) => prev + 1);
    } else {
      activeTimeTracker.pause();
      setSection("summary");
      await markLessonComplete();
    }
  };

  const startExercises = async () => {
    setRetrying(true);
    setResults([]);
    setExerciseIndex(0);
    setSection("exercise");
    activeTimeTracker.start();
  };

  const sections = ["intro", "vocab", "grammar", "exercise", "summary"] as const;
  const currentSectionIndex = sections.indexOf(section);

  return (
    <div className="animate-fade-in px-4 py-6 safe-top">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/kurs/" className="rounded-full bg-gray-100 p-2 text-muted hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted truncate">
            {moduleTitle} · Lektion {lessonNumber}/{totalLessons}
          </p>
          <h1 className="text-xl font-bold truncate">{lesson.title}</h1>
        </div>
      </header>

      <div className="mb-6">
        <ProgressBar value={currentSectionIndex + 1} max={sections.length} />
        <p className="mt-1 text-right text-xs text-muted">
          Schritt {currentSectionIndex + 1} von {sections.length}
        </p>
      </div>

      {section === "intro" && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">Einführung</h2>
          <p className="mb-6 text-muted">{lesson.introduction}</p>
          <Button onClick={() => setSection("vocab")} fullWidth>
            Los geht&apos;s
          </Button>
        </section>
      )}

      {section === "vocab" && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Neue Vokabeln</h2>
            <span className="text-xs text-muted">{lesson.vocabulary.length} Wörter</span>
          </div>
          <VocabularyList items={lesson.vocabulary} />
          <div className="mt-6">
            <Button onClick={() => setSection("grammar")} fullWidth>
              Weiter zur Grammatik
            </Button>
          </div>
        </section>
      )}

      {section === "grammar" && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">{lesson.grammar.title}</h2>
          <p className="mb-4 text-muted">{lesson.grammar.explanation}</p>
          <div className="mb-6 space-y-3">
            {lesson.grammar.examples.map((example, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="mb-1 text-lg font-medium">{example.bg}</p>
                <p className="text-sm text-muted">{example.de}</p>
                {progress.settings.showLatin && example.bgLatin && (
                  <p className="text-xs text-muted">{example.bgLatin}</p>
                )}
                <div className="mt-2"
                >
                  <SpeakButton text={example.bg} progress={progress} variant="inline" label="Anhören" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={async () => {
            if (lesson.exercises.length === 0) {
              setSection("summary");
              await markLessonComplete();
            } else {
              activeTimeTracker.start();
              setSection("exercise");
            }
          }} fullWidth>
            {lesson.exercises.length === 0 ? "Lektion abschließen" : "Übungen starten"}
          </Button>
        </section>
      )}

      {section === "exercise" && lesson.exercises[exerciseIndex] && (
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted">
              Übung {exerciseIndex + 1} von {lesson.exercises.length}
            </span>
            <ProgressBar
              value={exerciseIndex + 1}
              max={lesson.exercises.length}
              className="w-24"
            />
          </div>
          <ExerciseEngine
            exercise={lesson.exercises[exerciseIndex]}
            onComplete={(correct: boolean) => void handleExerciseComplete(correct)}
          />
        </section>
      )}

      {section === "summary" && (
        <section className="card text-center">
          <div className={cn(
            "mb-4 inline-flex rounded-full p-4",
            gate.passed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          )}>
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-bold">{gate.passed ? "Lektion gemeistert!" : "Lektion abgeschlossen"}</h2>
          <p className="mb-6 text-muted">{lesson.summary}</p>
          {summary && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-2xl font-bold">{Math.round(summary.accuracy * 100)}%</p>
                <p className="text-xs text-muted">Genauigkeit</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-2xl font-bold">{summary.activeMinutes} min</p>
                <p className="text-xs text-muted">aktiv gelernt</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-2xl font-bold">{summary.score}</p>
                <p className="text-xs text-muted">Punkte</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-2xl font-bold">+{summary.xpEarned} XP</p>
                <p className="text-xs text-muted">Erfahrung</p>
              </div>
            </div>
          )}
          {!gate.passed && (
            <p className="mb-4 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              {summary?.feedback ?? "Wiederhole die Lektion, um sie zu meistern."}
            </p>
          )}
          <div className="space-y-3">
            {!isCompleted && (
              <Button onClick={markLessonComplete} fullWidth>
                Als abgeschlossen markieren
              </Button>
            )}
            {!gate.passed && !retrying && (
              <Button onClick={startExercises} variant="outline" fullWidth>
                <RotateCcw className="mr-2 h-4 w-4" /> Wiederholen
              </Button>
            )}
            {nextLessonId ? (
              <Link href={`/kurs/${lesson.moduleId}/${nextLessonId}/`}>
                <Button fullWidth variant={isMastered ? "primary" : "outline"}>Nächste Lektion</Button>
              </Link>
            ) : (
              <Link href="/kurs/">
                <Button fullWidth variant={isMastered ? "primary" : "outline"}>Zurück zum Kurs</Button>
              </Link>
            )}
            <Link href="/kurs/">
              <Button variant="outline" fullWidth>Kursübersicht</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
