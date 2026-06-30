"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProgressStore } from "@/stores/useProgressStore";
import { getAllModules } from "@/lib/content";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Flame, BookOpen, Trophy, CheckCircle2, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const progress = useProgressStore((state) => state.progress);
  const modules = getAllModules();
  const allLessons = modules.flatMap((m) => m.lessons);
  const completed = progress.completedLessons.length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      {/* User Info */}
      <div className="card mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-2xl font-bold text-primary">
          {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
        </div>
        <h2 className="text-lg font-bold">{user?.name || "Lernender"}</h2>
        <p className="text-sm text-muted">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card flex flex-col items-center py-3">
          <Flame className="mb-1 h-5 w-5 text-orange-500" />
          <span className="text-lg font-bold">{progress.streak.current}</span>
          <span className="text-xs text-muted">Tage Streak</span>
        </div>
        <div className="card flex flex-col items-center py-3">
          <BookOpen className="mb-1 h-5 w-5 text-primary" />
          <span className="text-lg font-bold">{completed}</span>
          <span className="text-xs text-muted">Lektionen</span>
        </div>
        <div className="card flex flex-col items-center py-3">
          <Trophy className="mb-1 h-5 w-5 text-yellow-500" />
          <span className="text-lg font-bold">{progress.achievements.length}</span>
          <span className="text-xs text-muted">Achievements</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Gesamtfortschritt</span>
          <span className="text-muted">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {completed} von {total} Lektionen abgeschlossen
        </p>
      </div>

      {/* Achievements */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = progress.achievements.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "card flex flex-col items-center gap-1 py-4 text-center",
                  !unlocked && "opacity-50"
                )}
              >
                {unlocked ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <Lock className="h-6 w-6 text-muted" />
                )}
                <span className="text-sm font-medium">{achievement.title}</span>
                <span className="text-xs text-muted">{achievement.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="btn w-full justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </button>
    </main>
  );
}
