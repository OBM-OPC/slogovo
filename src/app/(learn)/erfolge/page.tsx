"use client";

import { CheckCircle2, Flame, Lock, ShieldCheck, Target, Trophy } from "lucide-react";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { ACHIEVEMENTS, achievementProgress } from "@/lib/achievements";
import { learningMetrics } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { AchievementIllustration } from "@/components/brand/Illustrations";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const progress = useProgressSafe();
  const metrics = learningMetrics(progress);
  const unlocked = new Set(progress.achievements);

  return (
    <main className="min-h-screen bg-rose-pattern px-4 py-6 safe-top pb-28 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Meilensteine</p><h1 className="mt-2 font-serif text-3xl font-bold">Deine Erfolge</h1><p className="mt-2 text-muted">Belohnungen entstehen durch nachgewiesenes Lernen – nicht durch bloßes Öffnen der App.</p></div>
          <AchievementIllustration className="hidden h-28 w-36 sm:block" />
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Aktuelle Motivation">
          <Card><Trophy className="h-5 w-5 text-gold-700" aria-hidden="true" /><p className="mt-2 font-serif text-2xl font-bold">{unlocked.size}/{ACHIEVEMENTS.length}</p><p className="text-xs text-muted">Erfolge freigeschaltet</p></Card>
          <Card><Target className="h-5 w-5 text-primary" aria-hidden="true" /><p className="mt-2 font-serif text-2xl font-bold">{metrics.weeklyLessons}/{progress.settings.weeklyLessonGoal}</p><p className="text-xs text-muted">Lektionen diese Woche</p></Card>
          <Card><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /><p className="mt-2 font-serif text-lg font-bold">{progress.streak.freezeUsedWeek ? "Diese Woche genutzt" : "Verfügbar"}</p><p className="text-xs text-muted">1 automatischer Streak-Schutz</p></Card>
        </section>

        {progress.streak.freezeAppliedOn && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-primary-50 p-3 text-sm text-primary"><Flame className="h-4 w-4" aria-hidden="true" />Dein Streak wurde nach einem verpassten Tag geschützt.</p>}

        <section className="mt-7 grid gap-4 sm:grid-cols-2" aria-label="Alle Erfolge">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked.has(achievement.id);
            const value = achievementProgress(achievement.id, progress);
            return <Card key={achievement.id} className={cn(!isUnlocked && "bg-warm-50/80")}>
              <div className="flex items-start gap-3">
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl", isUnlocked ? "bg-primary-50" : "bg-warm-100")} aria-hidden="true">{isUnlocked ? achievement.icon : <Lock className="h-5 w-5 text-muted" />}</span>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-serif font-bold">{achievement.title}</h2>{isUnlocked && <CheckCircle2 className="h-4 w-4 text-success" aria-label="Freigeschaltet" />}</div><p className="mt-1 text-sm leading-5 text-muted">{achievement.description}</p></div>
              </div>
              <div className="mt-4 flex justify-between text-xs"><span>{isUnlocked ? "Geschafft" : `${value.current} von ${value.target}`}</span><span>{value.percent}%</span></div>
              <ProgressBar className="mt-2" value={value.current} max={value.target} ariaLabel={`${achievement.title}: ${value.percent} Prozent`} barClassName={isUnlocked ? "bg-success" : undefined} />
            </Card>;
          })}
        </section>
      </div>
    </main>
  );
}
