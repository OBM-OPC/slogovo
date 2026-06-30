"use client";

import Link from "next/link";
import { useProgressStore } from "@/stores/useProgressStore";
import { getAllModules, getLessonsByModule } from "@/lib/content";
import { ModuleMeta } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Lock, CheckCircle2, Circle, Flame, BookOpen, Play, Type, Grid3X3, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Stats Bar ──
function StatsBar() {
  const progress = useProgressStore((state) => state.progress);
  const modules = getAllModules();
  const allLessons = modules.flatMap((m) => m.lessons);
  const completed = progress.completedLessons.length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
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
        <div className="mb-1 text-lg font-bold text-primary">{pct}%</div>
        <span className="text-xs text-muted">Fortschritt</span>
      </div>
    </div>
  );
}

// ── Continue Button ──
function ContinueButton() {
  const progress = useProgressStore((state) => state.progress);
  const modules = getAllModules().sort((a, b) => a.order - b.order);
  const allLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.moduleId }))
  );
  const next = allLessons.find(
    (l) => !progress.completedLessons.includes(l.lessonId)
  );

  if (!next) {
    return (
      <div className="card mb-6 bg-primary-50 text-center">
        <p className="font-semibold text-primary">🎉 Alle Lektionen abgeschlossen!</p>
      </div>
    );
  }

  return (
    <Link
      href={`/kurs/${next.moduleId}/${next.lessonId}/`}
      className="card mb-6 flex items-center gap-4 bg-primary text-white hover:bg-primary-600 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
        <Play className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm opacity-80">Weiterlernen</p>
        <p className="font-semibold">{next.title}</p>
      </div>
      <span className="text-sm opacity-60">{next.duration}</span>
    </Link>
  );
}

// ── Module Card (compact) ──
function ModuleCard({ module, isUnlocked }: { module: ModuleMeta; isUnlocked: boolean }) {
  const progress = useProgressStore((state) => state.progress);
  const lessons = getLessonsByModule(module.moduleId);
  const completedCount = lessons.filter((l) =>
    progress.completedLessons.includes(l.lessonId)
  ).length;
  const total = lessons.length;

  return (
    <Link
      href={`/kurs/${module.moduleId}/`}
      className={cn(
        "card mb-3 block transition-colors hover:border-primary/30",
        !isUnlocked && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        {!isUnlocked ? (
          <Lock className="h-5 w-5 text-muted" />
        ) : completedCount === total ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-primary" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded">
              {module.level}
            </span>
            <h3 className="font-semibold truncate">{module.title}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ProgressBar value={completedCount} max={total} className="flex-1" />
            <span className="text-xs text-muted">{completedCount}/{total}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Quick Access Tiles ──
function QuickTiles() {
  const tiles = [
    { href: "/vokabeln", icon: Type, label: "Vokabeln", desc: "Karteikarten & Übungen" },
    { href: "/alphabet", icon: Grid3X3, label: "Alphabet", desc: "Kyrillisch lernen" },
    { href: "/grammatik", icon: BookMarked, label: "Grammatik", desc: "Regeln & Beispiele" },
  ];

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Schnellzugriff</h2>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="card flex flex-col items-center gap-1 py-4 text-center hover:border-primary/30 transition-colors"
          >
            <tile.icon className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">{tile.label}</span>
            <span className="text-xs text-muted">{tile.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function LernenPage() {
  const progress = useProgressStore((state) => state.progress);
  const modules = getAllModules().sort((a, b) => a.order - b.order);

  const modulesByLevel = modules.reduce<Record<string, ModuleMeta[]>>((acc, m) => {
    if (!acc[m.level]) acc[m.level] = [];
    acc[m.level].push(m);
    return acc;
  }, {});
  const levels = Object.keys(modulesByLevel).sort();

  // Unlock logic
  let flatIndex = 0;
  const moduleUnlockMap: Record<string, boolean> = {};
  const flatModules: ModuleMeta[] = [];
  for (const level of levels) {
    for (const m of modulesByLevel[level]) {
      flatModules.push(m);
      const prev = flatModules[flatIndex - 1];
      moduleUnlockMap[m.moduleId] =
        flatIndex === 0 || !prev || progress.completedModules.includes(prev.moduleId);
      flatIndex++;
    }
  }

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-1 text-2xl font-bold">Lernen</h1>
      <p className="mb-4 text-sm text-muted">Bulgarisch Schritt für Schritt</p>

      <StatsBar />
      <ContinueButton />
      <QuickTiles />

      <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Kurs</h2>
      {levels.map((level) => (
        <div key={level} className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              {level}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {modulesByLevel[level].map((module) => (
            <ModuleCard
              key={module.moduleId}
              module={module}
              isUnlocked={moduleUnlockMap[module.moduleId]}
            />
          ))}
        </div>
      ))}
    </main>
  );
}
