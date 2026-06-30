"use client";

import { useState } from "react";
import Link from "next/link";
import { Lesson } from "@/types";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { VocabularyList } from "@/components/vocabulary/VocabularyList";
import { ExerciseEngine } from "@/components/quiz/ExerciseEngine";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getModuleById } from "@/lib/content";

interface LessonViewProps {
  lesson: Lesson;
  moduleId: string;
  nextLessonId: string | null;
  context: { moduleId: string; moduleTitle: string; lessonIndex: number; totalLessons: number } | null;
}

export function LessonView({ lesson, moduleId, nextLessonId, context }: LessonViewProps) {
  const progress = useProgressSafe();
  const completeLesson = useProgressStore((state) => state.completeLesson);
  const addStudyTime = useProgressStore((state) => state.addStudyTime);

  const [section, setSection] = useState<"intro" | "vocab" | "grammar" | "exercise" | "summary">("intro");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseScore, setExerciseScore] = useState(0);
  const isCompleted = progress.completedLessons.includes(lesson.lessonId);

  const moduleTitle = context?.moduleTitle ?? getModuleById(moduleId)?.title ?? moduleId;
  const lessonNumber = context?.lessonIndex ?? 0;
  const totalLessons = context?.totalLessons ?? 0;

  const markLessonComplete = async () => {
    if (isCompleted) return;
    await completeLesson(lesson.lessonId);
    await addStudyTime(15, lesson.vocabulary.length);
  };

  const handleExerciseComplete = async () => {
    setExerciseScore((prev) => prev + 1);
    if (exerciseIndex < lesson.exercises.length - 1) {
      setExerciseIndex((prev) => prev + 1);
    } else {
      setSection("summary");
      await markLessonComplete();
    }
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
            onComplete={handleExerciseComplete}
          />
        </section>
      )}

      {section === "summary" && (
        <section className="card text-center">
          <div className="mb-4 inline-flex rounded-full bg-success/10 p-4 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-bold">{isCompleted ? "Lektion abgeschlossen!" : "Geschafft!"}</h2>
          <p className="mb-6 text-muted">{lesson.summary}</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-2xl font-bold">{lesson.vocabulary.length}</p>
              <p className="text-xs text-muted">neue Vokabeln</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-2xl font-bold">{exerciseScore}</p>
              <p className="text-xs text-muted">Übungspunkte</p>
            </div>
          </div>
          <div className="space-y-3">
            {!isCompleted && (
              <Button
                onClick={markLessonComplete}
                fullWidth
              >
                Als abgeschlossen markieren
              </Button>
            )}
            {nextLessonId ? (
              <Link href={`/kurs/${lesson.moduleId}/${nextLessonId}/`}>
                <Button fullWidth variant={isCompleted ? "primary" : "outline"}>Nächste Lektion</Button>
              </Link>
            ) : (
              <Link href="/kurs/">
                <Button fullWidth variant={isCompleted ? "primary" : "outline"}>Zurück zum Kurs</Button>
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
