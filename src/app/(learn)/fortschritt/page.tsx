"use client";

import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { getAllModules, getAllVocabulary } from "@/lib/content";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame, BookOpen, Brain, Award, Clock, RotateCcw } from "lucide-react";
import { todayISO } from "@/lib/utils";

export default function ProgressPage() {
  const progress = useProgressSafe();
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const modules = getAllModules();
  const totalLessons = modules.flatMap((m) => m.lessons).length;
  const totalVocab = getAllVocabulary().length;
  const todayStats = progress.dailyStats[todayISO()] || { minutes: 0, vocabulary: 0 };

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Dein Fortschritt</h1>
      <p className="mb-6 text-muted">Behalte deine Lernstatistiken im Blick.</p>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="card flex flex-col items-center gap-1">
          <Flame className="h-6 w-6 text-accent" />
          <span className="text-2xl font-bold">{progress.streak.current}</span>
          <span className="text-xs text-muted">Tages-Streak</span>
        </div>
        <div className="card flex flex-col items-center gap-1">
          <Clock className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">{todayStats.minutes}</span>
          <span className="text-xs text-muted">Min. heute</span>
        </div>
        <div className="card flex flex-col items-center gap-1">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">{progress.completedLessons.length}/{totalLessons}</span>
          <span className="text-xs text-muted">Lektionen</span>
        </div>
        <div className="card flex flex-col items-center gap-1">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">{Object.keys(progress.vocabularyProgress).length}/{totalVocab}</span>
          <span className="text-xs text-muted">Vokabeln</span>
        </div>
      </section>

      <section className="card mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium">Gesamtfortschritt</span>
          <span className="text-sm text-muted">{Math.round((progress.completedLessons.length / totalLessons) * 100)}%</span>
        </div>
        <ProgressBar value={progress.completedLessons.length} max={totalLessons} />
      </section>

      <section className="card mb-6">
        <h2 className="mb-3 text-lg font-semibold">Übungsstatistik</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xl font-bold">{progress.exerciseStats.total}</p>
            <p className="text-xs text-muted">Gesamt</p>
          </div>
          <div className="rounded-xl bg-success/10 p-3">
            <p className="text-xl font-bold text-success">{progress.exerciseStats.correct}</p>
            <p className="text-xs text-muted">Richtig</p>
          </div>
          <div className="rounded-xl bg-danger/10 p-3">
            <p className="text-xl font-bold text-danger">{progress.exerciseStats.wrong}</p>
            <p className="text-xs text-muted">Falsch</p>
          </div>
        </div>
      </section>

      <section className="card mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Award className="h-5 w-5 text-warning" /> Erfolge
        </h2>
        {progress.achievements.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Erfolge freigeschaltet. Lern weiter!</p>
        ) : (
          <ul className="space-y-2">
            {progress.achievements.map((a) => (
              <li key={a} className="rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
                {a}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="btn-ghost w-full"
        onClick={() => {
          if (confirm("Möchtest du wirklich alle Fortschritte zurücksetzen?")) {
            resetProgress();
          }
        }}
      >
        <RotateCcw className="h-5 w-5" /> Fortschritt zurücksetzen
      </button>
    </main>
  );
}
