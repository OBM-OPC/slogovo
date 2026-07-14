"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllModules } from "@/lib/content";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Flame, BookOpen, Trophy, CheckCircle2, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { learningMetrics } from "@/lib/gamification";
import Link from "next/link";

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const progress = useProgressSafe();
  const modules = getAllModules();
  const allLessons = modules.flatMap((m) => m.lessons);
  const completed = progress.completedLessons.length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const metrics = learningMetrics(progress);

  return (
    <main className="animate-fade-in bg-rose-pattern min-h-screen px-4 py-6 safe-top">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Профил</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">Profil</h1>
      </div>

      {/* User Card */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card text-3xl font-serif font-bold text-primary ring-4 ring-primary-50">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
          </div>
          <h2 className="text-xl font-serif font-bold">{user?.name || "Lernender"}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="grid grid-cols-3 divide-x divide-warm-100">
          <div className="flex flex-col items-center py-4">
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-xl font-bold font-serif">{progress.streak.current}</span>
            <span className="text-xs text-muted">Tage Streak</span>
          </div>
          <div className="flex flex-col items-center py-4">
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold font-serif">{completed}</span>
            <span className="text-xs text-muted">Lektionen</span>
          </div>
          <div className="flex flex-col items-center py-4">
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-gold-50">
              <Trophy className="h-5 w-5 text-gold" />
            </div>
            <span className="text-xl font-bold font-serif">{progress.achievements.length}</span>
            <span className="text-xs text-muted">Erfolge</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-8">
        <div className="mb-3 flex justify-between items-center">
          <span className="font-serif font-bold">Gesamtfortschritt</span>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-warm-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary-400 to-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          {completed} von {total} Lektionen abgeschlossen
        </p>
      </div>

      {/* Achievements */}
      <div className="card mb-8">
        <h3 className="mb-3 font-serif font-bold">Was Belohnungen antreibt</h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-primary-50 p-3"><p className="text-xl font-bold">{metrics.masteredWords}</p><p className="text-xs text-muted">Wörter gemeistert</p></div>
          <div className="rounded-xl bg-primary-50 p-3"><p className="text-xl font-bold">{metrics.productionAttempts}</p><p className="text-xs text-muted">Produktive Versuche</p></div>
          <div className="rounded-xl bg-primary-50 p-3"><p className="text-xl font-bold">{metrics.activeMinutes}</p><p className="text-xs text-muted">Aktive Minuten</p></div>
          <div className="rounded-xl bg-primary-50 p-3"><p className="text-xl font-bold">{metrics.weeklyLessons}/{progress.settings.weeklyLessonGoal}</p><p className="text-xs text-muted">Wochenlektionen</p></div>
        </div>
        <p className="mt-3 text-xs text-muted">Öffnen, Durchklicken und wiederholtes leichtes Tippen erzeugen keine Belohnung.</p>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">
          Постижения
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = progress.achievements.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-3xl p-4 text-center shadow-card transition-all duration-200",
                  unlocked
                    ? "bg-white"
                    : "bg-warm-50/50 opacity-50"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  unlocked ? "bg-primary-50" : "bg-warm-100"
                )}>
                  {unlocked ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted" />
                  )}
                </div>
                <span className="text-sm font-serif font-bold">{achievement.title}</span>
                <span className="text-xs text-muted leading-tight">{achievement.description}</span>
              </div>
            );
          })}
        </div>
        <Link href="/erfolge" className="btn-outline mt-4 flex w-full justify-center">Alle Erfolge und Fortschritte</Link>
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); }}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-accent-100 bg-white px-5 py-4 text-accent shadow-card transition-all duration-200 hover:bg-accent-50 hover:shadow-card-hover"
      >
        <LogOut className="h-4 w-4" />
        <span className="font-medium">Abmelden</span>
      </button>
    </main>
  );
}
