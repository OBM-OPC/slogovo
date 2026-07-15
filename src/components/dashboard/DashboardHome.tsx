"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CircleAlert, Clock3, Flame, Library, Mic, RefreshCcw, RotateCcw, Settings, Sparkles, UserRound, Volume2 } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CardSkeleton, ListSkeleton } from "@/components/ui/LearningSkeleton";

export function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/dashboard", { credentials: "same-origin", cache: "no-store" });
      const body = await response.json() as { dashboard?: DashboardData; error?: string };
      if (!response.ok || !body.dashboard) throw new Error(body.error || "Dashboard konnte nicht geladen werden.");
      setData(body.dashboard);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard konnte nicht geladen werden.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (error) return <main className="min-h-screen px-4 py-8 safe-top"><Card className="text-center"><RefreshCcw className="mx-auto h-8 w-8 text-danger" aria-hidden="true" /><h1 className="mt-4 text-xl font-bold">Lernstand nicht verfügbar</h1><p className="mt-2 text-sm text-muted">{error}</p><button type="button" onClick={() => void load()} className="btn-primary mt-5 min-h-12">Erneut versuchen</button></Card></main>;
  if (!data) return <main className="min-h-screen space-y-4 px-4 py-8 safe-top" aria-busy="true"><span className="sr-only" role="status">Dashboard wird geladen</span><CardSkeleton /><div className="grid grid-cols-2 gap-3"><CardSkeleton /><CardSkeleton /></div><ListSkeleton items={2} /></main>;

  return (
    <main className="min-h-screen bg-rose-pattern px-4 py-6 safe-top">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Dein heutiger Plan</p><h1 className="mt-1 text-3xl font-bold">Lernen</h1><p className="mt-2 text-sm text-muted">Dein nächster sinnvoller Schritt – ohne Suchen.</p></div>
        <div className="flex gap-2 md:hidden"><Link href="/profil" aria-label="Profil" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-muted shadow-card"><UserRound className="h-5 w-5" aria-hidden="true" /></Link><Link href="/einstellungen" aria-label="Einstellungen" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-muted shadow-card"><Settings className="h-5 w-5" aria-hidden="true" /></Link></div>
      </header>

      <section aria-labelledby="next-action-title" className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-white shadow-card">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold uppercase tracking-widest text-primary-100">{data.nextAction.eyebrow}</p><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><Clock3 className="h-4 w-4" aria-hidden="true" /> {data.nextAction.duration}</span></div>
          <h2 id="next-action-title" className="mt-4 text-3xl font-bold">{data.nextAction.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white">{data.nextAction.description}</p>
          {data.nextAction.moduleTitle && <div className="mt-6"><div className="mb-2 flex justify-between gap-3 text-xs text-white"><span>{data.nextAction.moduleTitle}</span><span>{data.nextAction.moduleCompleted}/{data.nextAction.moduleTotal} Lektionen</span></div><ProgressBar value={data.nextAction.moduleProgress} ariaLabel="Kapitel-Fortschritt" className="bg-white/15" barClassName="bg-white" /></div>}
          <Link href={data.nextAction.href} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold text-primary shadow-card">Heute lernen <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card variant="interactive" className="flex flex-col">
          <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-danger"><RotateCcw className="h-5 w-5" aria-hidden="true" /></span><span className="text-3xl font-bold tabular-nums">{data.review.due}</span></div>
          <h2 className="mt-4 text-lg font-bold">Heute wiederholen</h2>
          <p className="mt-1 flex-1 text-sm text-muted">{data.review.due === 0 ? "Alles erledigt – neue Wiederholungen erscheinen automatisch." : `${data.review.estimatedMinutes} Min. für deinen fälligen Wortschatz.`}</p>
          <Link href="/wiederholen" className="mt-4 inline-flex min-h-11 items-center font-bold text-primary">Zur Wiederholung <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
        </Card>
        <Card variant="interactive">
          <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-50 text-gold-800"><Sparkles className="h-5 w-5" aria-hidden="true" /></span><span className="text-lg font-bold tabular-nums">{data.weeklyGoal.completedDays}/{data.weeklyGoal.targetDays}</span></div>
          <h2 className="mt-4 text-lg font-bold">Wochenziel</h2>
          <p className="mt-1 text-sm text-muted">Lerntage mit erreichtem Tagesziel</p>
          <ProgressBar value={data.weeklyGoal.percent} ariaLabel="Fortschritt des Wochenziels" className="mt-4" />
        </Card>
      </div>

      <section className="mt-7" aria-labelledby="stats-heading">
        <div className="mb-3 flex items-center justify-between"><h2 id="stats-heading" className="text-lg font-bold">Diese Reise gehört dir</h2><Link href="/fortschritt" className="inline-flex min-h-11 items-center text-sm font-bold text-primary">Details</Link></div>
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={Flame} value={data.stats.streak} label="Tage am Stück" tone="text-orange-600 bg-orange-50" />
          <Metric icon={BookOpenCheck} value={data.stats.lessons} label="Lektionen" tone="text-primary bg-primary-50" />
          <Metric icon={Clock3} value={data.stats.activeMinutes} label="aktive Minuten" tone="text-gold-800 bg-gold-50" />
          <Metric icon={Volume2} value={data.stats.masteredWords} label="Wörter gemeistert" tone="text-accent bg-accent-50" />
        </div>
      </section>

      <section className="mt-7" aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="mb-3 text-lg font-bold">Schnell üben</h2>
        <div className="grid grid-cols-3 gap-3">
          <PracticeLink href="/sprechen" label="Sprechen" icon={Mic} />
          <PracticeLink href="/fehler" label="Fehler" icon={CircleAlert} />
          <PracticeLink href="/vokabeln" label="Wortschatz" icon={Library} />
        </div>
      </section>

      {data.nextAchievement && <Card className="mt-7 border-gold-200 bg-gold-50/70"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-card" aria-hidden="true">{data.nextAchievement.icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-widest text-gold-800">Nächster Meilenstein</p><h2 className="mt-1 text-lg font-bold">{data.nextAchievement.title}</h2><p className="mt-1 text-sm leading-6 text-muted">{data.nextAchievement.description}</p><div className="mt-3 flex items-center gap-3"><ProgressBar value={data.nextAchievement.percent} ariaLabel={`Fortschritt für ${data.nextAchievement.title}`} barClassName="bg-gold-700" /><span className="shrink-0 text-xs font-bold tabular-nums">{data.nextAchievement.current}/{data.nextAchievement.target}</span></div></div></div></Card>}
    </main>
  );
}

function Metric({ icon: Icon, value, label, tone }: { icon: typeof Flame; value: number; label: string; tone: string }) {
  return <Card className="p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><p className="mt-3 text-2xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted">{label}</p></Card>;
}

function PracticeLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Mic }) {
  return <Link href={href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-3 text-center text-xs font-bold shadow-card transition-transform hover:-translate-y-0.5"><Icon className="h-5 w-5 text-primary" aria-hidden="true" />{label}</Link>;
}
