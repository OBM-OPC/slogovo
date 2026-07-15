"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, Brain, CheckCircle2, Clock3, Headphones, RefreshCw, ShieldCheck, Target, TriangleAlert } from "lucide-react";
import type { ProgressInsights } from "@/lib/progress-insights";
import { LearningSkeleton } from "@/components/ui/LearningSkeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function Metric({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof Clock3 }) {
  return (
    <Card className="min-w-0">
      <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
      <p className="break-words font-serif text-3xl font-bold">{value}</p>
      <h2 className="mt-1 font-semibold">{label}</h2>
      <p className="mt-1 text-xs leading-5 text-muted">{note}</p>
    </Card>
  );
}

function AccuracyCard({ title, icon: Icon, correct, total, accuracy, empty }: { title: string; icon: typeof Headphones; correct: number; total: number; accuracy: number | null; empty: string }) {
  const percent = accuracy === null ? null : Math.round(accuracy * 100);
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="h-5 w-5 text-primary" aria-hidden="true" />{title}</h2>
      {percent === null ? <p className="mt-4 text-sm text-muted">{empty}</p> : <>
        <div className="mt-4 flex items-end justify-between gap-3"><p className="font-serif text-4xl font-bold">{percent}%</p><p className="text-sm text-muted">{correct} von {total}</p></div>
        <ProgressBar className="mt-3" value={correct} max={total} ariaLabel={`${title}: ${percent} Prozent`} />
        <p className="mt-2 text-xs text-muted">Nur erste, tatsächlich bewertete Antworten</p>
      </>}
    </Card>
  );
}

export default function ProgressPage() {
  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/progress/insights", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("insights unavailable");
      const body = await response.json() as { insights?: ProgressInsights };
      if (!body.insights) throw new Error("insights missing");
      setInsights(body.insights);
    } catch {
      setError(true);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadInsights(); }, [loadInsights]);

  if (loading) return <LearningSkeleton />;

  if (error || !insights) return (
    <main className="px-4 py-8 safe-top">
      <Card className="mx-auto max-w-xl border-danger/20 bg-danger/5 text-center" role="alert">
        <TriangleAlert className="mx-auto h-8 w-8 text-danger" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl font-bold">Lernstand nicht verfügbar</h1>
        <p className="mt-2 text-sm text-muted">Deine Daten bleiben sicher gespeichert. Bitte lade die Auswertung erneut.</p>
        <Button className="mt-5" onClick={() => void loadInsights()}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Erneut laden</Button>
      </Card>
    </main>
  );

  const hasLearningState = insights.lessonsPassed > 0 || insights.wordsLearned > 0 || insights.activeStudyMinutes > 0 || insights.listening.total > 0 || insights.grammar.total > 0;
  const studyTime = insights.activeStudyMinutes >= 60
    ? `${Math.floor(insights.activeStudyMinutes / 60)} Std. ${insights.activeStudyMinutes % 60} Min.`
    : `${insights.activeStudyMinutes} Min.`;

  return (
    <main className="min-h-screen bg-rose-pattern px-4 py-6 safe-top pb-28 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><BarChart3 className="h-4 w-4" aria-hidden="true" /> Fortschritt</p>
            <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Was du wirklich gelernt hast</h1>
            <p className="mt-2 max-w-2xl leading-7 text-muted">Verständliche Lernmetriken aus deinen echten Antworten, Wiederholungen und aktiven Lernzeiten.</p>
          </div>
          <p className="mt-4 flex shrink-0 items-center gap-2 text-xs font-medium text-muted sm:mt-0"><ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Serverseitig berechnet</p>
        </header>

        {!hasLearningState ? (
          <Card className="text-center">
            <Brain className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold">Noch keine Lernereignisse</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">Nach deiner ersten beantworteten Lektion oder Wiederholung erscheinen hier belastbare Werte.</p>
            <Link href="/heute-lernen" className="btn-primary mt-5 inline-flex">Heute lernen</Link>
          </Card>
        ) : <>
          <section aria-label="Wichtigste Lernmetriken" className="grid gap-3 sm:grid-cols-3">
            <Metric icon={Brain} value={insights.wordsLearned} label="Wörter gelernt" note="Mindestens 3 Antworten und ≥70% Sicherheit" />
            <Metric icon={BookOpen} value={insights.lessonsPassed} label="Lektionen abgeschlossen" note={`${insights.lessonsMastered} davon auf Mastery-Niveau`} />
            <Metric icon={Clock3} value={studyTime} label="Aktive Lernzeit" note="Pausen und inaktive Tabs zählen nicht" />
          </section>

          <section aria-label="Genauigkeit" className="mt-5 grid gap-3 md:grid-cols-2">
            <AccuracyCard title="Hörverstehen" icon={Headphones} {...insights.listening} empty="Noch keine bewerteten Hörübungen." />
            <AccuracyCard title="Grammatik-Mastery" icon={CheckCircle2} {...insights.grammar} empty="Noch keine bewerteten Grammatikübungen." />
          </section>

          <section aria-label="Aktuelle Ziele" className="mt-5 grid gap-3 md:grid-cols-2">
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-bold"><Target className="h-5 w-5 text-primary" aria-hidden="true" /> Wochenziel</h2>
              <div className="mt-4 flex items-end justify-between"><p className="font-serif text-3xl font-bold">{insights.weeklyGoal.completedDays}/{insights.weeklyGoal.targetDays}</p><p className="text-sm text-muted">Lerntage</p></div>
              <ProgressBar className="mt-3" value={insights.weeklyGoal.completedDays} max={insights.weeklyGoal.targetDays} ariaLabel={`Wochenziel: ${insights.weeklyGoal.completedDays} von ${insights.weeklyGoal.targetDays} Lerntagen`} />
              <p className="mt-2 text-xs text-muted">Die Tagesdauer folgt deinem gewählten Lernpensum.</p>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 text-lg font-bold"><RefreshCw className="h-5 w-5 text-primary" aria-hidden="true" /> Heutige Wiederholungen</h2>
              {insights.reviewCompletion.percent === null ? <>
                <p className="mt-4 font-serif text-3xl font-bold">Alles erledigt</p>
                <p className="mt-2 text-sm text-muted">Zu Tagesbeginn war keine Wiederholung fällig.</p>
              </> : <>
                <div className="mt-4 flex items-end justify-between"><p className="font-serif text-3xl font-bold">{insights.reviewCompletion.percent}%</p><p className="text-sm text-muted">{insights.reviewCompletion.completed}/{insights.reviewCompletion.due} erledigt</p></div>
                <ProgressBar className="mt-3" value={insights.reviewCompletion.completed} max={insights.reviewCompletion.due} ariaLabel={`Wiederholungen: ${insights.reviewCompletion.completed} von ${insights.reviewCompletion.due} erledigt`} />
              </>}
            </Card>
          </section>

          {insights.weakAreas.length > 0 && <Card className="mt-5">
            <h2 className="text-lg font-bold">Deine nächsten Übungsfelder</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">{insights.weakAreas.map((area) => <li key={area.label} className="rounded-2xl bg-warm-50 p-3"><span className="block text-sm">{area.label}</span><strong className="text-xl">{Math.round(area.accuracy * 100)}%</strong></li>)}</ul>
          </Card>}
        </>}
      </div>
    </main>
  );
}
