"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Brain, CheckCircle2, Clock, Headphones, PenLine, RotateCcw, TriangleAlert, TrendingDown, TrendingUp } from "lucide-react";
import { useProgressInitialized, useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllModules, getLessonsByModule } from "@/lib/content";
import { buildProgressInsights, type ProgressAttemptSummary } from "@/lib/progress-insights";
import { todayISO } from "@/lib/utils";
import { LearningSkeleton } from "@/components/ui/LearningSkeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Clock }) {
  return (
    <div className="card min-w-0">
      <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
      <p className="break-words text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export default function ProgressPage() {
  const progress = useProgressSafe();
  const initialized = useProgressInitialized();
  const [attempts, setAttempts] = useState<ProgressAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/progress/insights", { credentials: "include" });
      if (!response.ok) throw new Error("insights unavailable");
      const body = await response.json() as { attempts?: ProgressAttemptSummary[] };
      setAttempts(Array.isArray(body.attempts) ? body.attempts : []);
    } catch {
      setError(true);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized) void loadAttempts();
  }, [initialized, loadAttempts]);

  const grammarLessons = useMemo(() => getAllModules().flatMap((module) =>
    getLessonsByModule(module.moduleId).map((lesson) => ({
      lessonId: lesson.lessonId,
      title: lesson.grammar.title,
    }))
  ), []);
  const insights = useMemo(
    () => buildProgressInsights(progress, attempts, grammarLessons, todayISO()),
    [attempts, grammarLessons, progress]
  );
  const hasLearningState = insights.lessonsPassed > 0
    || Object.keys(progress.vocabularyProgress).length > 0
    || insights.activeStudyMinutes > 0
    || attempts.length > 0;

  if (!initialized || loading) return <LearningSkeleton />;

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Dein Lernstand</h1>
      <p className="mb-6 text-muted">Mastery, fällige Arbeit und Entwicklung aus deinen echten Lernereignissen.</p>

      {error && (
        <section role="alert" className="card mb-6 border border-danger/20 bg-danger/5">
          <TriangleAlert className="mb-2 h-6 w-6 text-danger" />
          <h2 className="font-bold">Versuchsdetails nicht verfügbar</h2>
          <p className="mb-4 text-sm text-muted">Gespeicherte Mastery-Werte bleiben sichtbar. Hörleistung und Verbesserung können erneut geladen werden.</p>
          <Button onClick={() => void loadAttempts()} variant="outline" fullWidth><RotateCcw className="h-4 w-4" /> Erneut laden</Button>
        </section>
      )}

      {!hasLearningState ? (
        <section className="card text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="mb-2 text-lg font-bold">Noch keine Lernereignisse</h2>
          <p className="mb-5 text-sm text-muted">Nach der ersten beantworteten Lektion oder Wiederholung erscheinen hier belastbare Werte.</p>
          <Link href="/heute-lernen"><Button fullWidth>Heute lernen</Button></Link>
        </section>
      ) : (
        <>
          <section aria-label="Kernmetriken" className="mb-6 grid grid-cols-2 gap-3">
            <Metric icon={Clock} value={insights.activeStudyMinutes} label="Aktive Minuten" />
            <Metric icon={BookOpen} value={insights.lessonsPassed} label="Lektionen bestanden" />
            <Metric icon={CheckCircle2} value={insights.lessonsMastered} label="Lektionen gemeistert" />
            <Metric icon={RotateCcw} value={insights.vocabularyDue} label="Vokabeln fällig" />
            <Metric icon={Brain} value={insights.receptiveVocabularyMastered} label="Rezeptiv gemeistert" />
            <Metric icon={PenLine} value={insights.productiveVocabularyMastered} label="Produktiv gemeistert" />
          </section>

          <section className="card mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Headphones className="h-5 w-5 text-primary" /> Hörverstehen</h2>
            {insights.listening.accuracy === null ? (
              <p className="text-sm text-muted">Noch keine bewerteten Hörübungen.</p>
            ) : (
              <><p className="mb-2 text-2xl font-bold">{Math.round(insights.listening.accuracy * 100)}%</p><ProgressBar value={insights.listening.correct} max={insights.listening.total} /><p className="mt-2 text-xs text-muted">{insights.listening.correct} von {insights.listening.total} ersten Versuchen</p></>
            )}
          </section>

          <section className="card mb-6">
            <h2 className="mb-3 text-lg font-semibold">Grammatik-Skills</h2>
            {insights.grammarSkills.length === 0 ? <p className="text-sm text-muted">Noch keine bewerteten Grammatiklektionen.</p> : (
              <div className="space-y-3">
                {insights.grammarSkills.slice(0, 6).map((skill) => (
                  <div key={skill.lessonId}>
                    <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{skill.title}</span><span className="font-medium">{skill.score}%</span></div>
                    <ProgressBar value={skill.score} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card mb-6">
            <h2 className="mb-3 text-lg font-semibold">Schwachstellen</h2>
            {insights.weakAreas.length === 0 ? <p className="text-sm text-muted">Noch keine belastbare Schwachstelle erkannt.</p> : (
              <ul className="space-y-2">{insights.weakAreas.map((area) => <li key={area.label} className="flex justify-between rounded-xl bg-warm-50 p-3 text-sm"><span>{area.label}</span><span className="font-bold">{Math.round(area.accuracy * 100)}%</span></li>)}</ul>
            )}
          </section>

          <section className="card">
            <h2 className="mb-3 text-lg font-semibold">Jüngste Entwicklung</h2>
            {insights.recentImprovement === null ? <p className="text-sm text-muted">Für einen Vergleich werden mindestens vier abgeschlossene Versuche benötigt.</p> : (
              <div className="flex items-center gap-3">
                {insights.recentImprovement >= 0 ? <TrendingUp className="h-8 w-8 text-success" /> : <TrendingDown className="h-8 w-8 text-danger" />}
                <div><p className="text-2xl font-bold">{insights.recentImprovement >= 0 ? "+" : ""}{insights.recentImprovement} Punkte</p><p className="text-xs text-muted">letzte Versuche gegenüber den vorherigen</p></div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
