"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllModules, getLessonsByModule } from "@/lib/content";
import { ModuleMeta } from "@/types";
import { Flame, BookOpen, Play, Type, Grid3X3, BookMarked, Lock, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function DebugProgress() {
  const progress = useProgressSafe();
  const [lsData, setLsData] = useState<object | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("slogovo-progress-v1");
      setLsData(raw ? JSON.parse(raw) : null);
    } catch {
      setLsData({ error: true });
    }
  }, []);
  
  const testLocalStorage = () => {
    try {
      const testKey = "slogovo-test";
      localStorage.setItem(testKey, JSON.stringify({ test: true, time: Date.now() }));
      const read = localStorage.getItem(testKey);
      const parsed = read ? JSON.parse(read) : null;
      setTestResult(`localStorage WORKS: ${JSON.stringify(parsed)}`);
      localStorage.removeItem(testKey);
    } catch (e) {
      setTestResult(`localStorage FAILED: ${e}`);
    }
  };
  
  const forceSaveProgress = () => {
    try {
      const fakeProgress = {
        userId: progress.userId,
        streak: { current: 99, longest: 99 },
        completedLessons: ["test-lesson-1", "test-lesson-2"],
        completedModules: [],
        vocabularyProgress: {},
        exerciseStats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
        dailyStats: {},
        settings: progress.settings,
        achievements: [],
      };
      localStorage.setItem("slogovo-progress-v1", JSON.stringify(fakeProgress));
      setTestResult("FAKE PROGRESS SAVED! Reload page to test.");
    } catch (e) {
      setTestResult(`Save FAILED: ${e}`);
    }
  };
  
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button onClick={testLocalStorage} className="rounded bg-primary px-2 py-1 text-xs text-white">Test localStorage</button>
        <button onClick={forceSaveProgress} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Force Save Progress</button>
      </div>
      {testResult && <div className="mb-2 rounded bg-yellow-100 p-2 text-xs text-yellow-800">{testResult}</div>}
      <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[10px] leading-tight">{JSON.stringify({
  userId: progress.userId,
  completedLessons: progress.completedLessons,
  completedModules: progress.completedModules,
  streak: progress.streak,
  localStorage: lsData,
}, null, 2)}</pre>
    </div>
  );
}

// ── Stats Bar (horizontal, flowing) ──
function StatsBar() {
  const progress = useProgressSafe();
  const modules = getAllModules();
  const allLessons = modules.flatMap((m) => m.lessons);
  const completed = progress.completedLessons.length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
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
            <span className="text-sm font-bold text-gold-600">{pct}%</span>
          </div>
          <span className="text-xl font-bold font-serif">{pct}%</span>
          <span className="text-xs text-muted">Fortschritt</span>
        </div>
      </div>
      {/* Progress bar at bottom */}
      <div className="h-1 w-full bg-warm-100">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary-400 to-gold transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Continue Button (large, pulsing) ──
function ContinueButton() {
  const progress = useProgressSafe();
  const modules = getAllModules().sort((a, b) => a.order - b.order);
  const allLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.moduleId }))
  );
  const next = allLessons.find(
    (l) => !progress.completedLessons.includes(l.lessonId)
  );

  if (!next) {
    return (
      <div className="mb-8 rounded-3xl bg-primary-50 p-6 text-center shadow-card">
        <p className="text-lg font-serif font-bold text-primary">🎉 Всички уроци са завършени!</p>
        <p className="mt-1 text-sm text-muted">Alle Lektionen abgeschlossen</p>
      </div>
    );
  }

  return (
    <Link
      href={`/kurs/${next.moduleId}/${next.lessonId}/`}
      className="group mb-8 block"
    >
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01]">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-transparent" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner animate-pulse-glow">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white/70">Продължи да учиш</p>
            <p className="text-lg font-serif font-bold text-white">{next.title}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              {next.duration}
            </span>
            <ChevronRight className="h-5 w-5 text-white/50" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Module Card (with colored left stripe) ──
function ModuleCard({ module, isUnlocked }: { module: ModuleMeta; isUnlocked: boolean }) {
  const progress = useProgressSafe();
  const lessons = getLessonsByModule(module.moduleId);
  const completedCount = lessons.filter((l) =>
    progress.completedLessons.includes(l.lessonId)
  ).length;
  const total = lessons.length;
  const isComplete = completedCount === total;
  const stripeColor = module.level === "A1" ? "bg-primary" : "bg-accent";

  return (
    <Link
      href={`/kurs/${module.moduleId}/`}
      className={cn(
        "group mb-3 flex overflow-hidden rounded-3xl bg-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.005]",
        !isUnlocked && "opacity-50"
      )}
    >
      {/* Colored left stripe */}
      <div className={cn("w-1.5 flex-shrink-0", stripeColor)} />
      <div className="flex flex-1 items-center gap-4 p-4">
        <div className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
          isComplete ? "bg-primary-50" : isUnlocked ? "bg-warm-50" : "bg-warm-100"
        )}>
          {!isUnlocked ? (
            <Lock className="h-5 w-5 text-muted" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-primary/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              module.level === "A1" ? "bg-primary-50 text-primary" : "bg-accent-50 text-accent"
            )}>
              {module.level}
            </span>
            <h3 className="font-serif font-bold truncate">{module.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-warm-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  module.level === "A1" ? "bg-primary" : "bg-accent"
                )}
                style={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted tabular-nums">{completedCount}/{total}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-warm-300 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}

// ── Quick Access Tiles ──
function QuickTiles() {
  const tiles = [
    { href: "/vokabeln", icon: Type, label: "Речник", sub: "Vokabeln", color: "bg-primary-50 text-primary" },
    { href: "/alphabet", icon: Grid3X3, label: "Азбука", sub: "Alphabet", color: "bg-accent-50 text-accent" },
    { href: "/grammatik", icon: BookMarked, label: "Граматика", sub: "Grammatik", color: "bg-gold-50 text-gold-700" },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]"
          >
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110", tile.color)}>
              <tile.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-serif font-bold">{tile.label}</span>
            <span className="text-xs text-muted">{tile.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function LernenPage() {
  const progress = useProgressSafe();
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
    <main className="animate-fade-in bg-rose-pattern min-h-screen px-4 py-6 safe-top">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Български език</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">Lernen</h1>
      </div>

      <StatsBar />
      <ContinueButton />
      <QuickTiles />

      {/* Course Modules */}
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Курс</h2>
        <div className="h-px flex-1 bg-warm-200" />
      </div>

      <div className="mt-4 space-y-6">
        {levels.map((level) => (
          <div key={level}>
            <div className="mb-3 flex items-center gap-3">
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-bold text-white",
                level === "A1" ? "bg-primary" : "bg-accent"
              )}>
                {level}
              </span>
              <span className="text-xs text-muted">
                {level === "A1" ? "Начинаещ" : "Напреднал"}
              </span>
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
      </div>
      {/* DEBUG PANEL */}
      <details className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs">
        <summary className="cursor-pointer font-bold text-red-700">🔧 Debug: Progress Store</summary>
        <DebugProgress />
      </details>
    </main>
  );
}
