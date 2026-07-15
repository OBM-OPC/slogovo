"use client";

import { useState } from "react";
import Link from "next/link";
import { getAllModules, getAllVocabulary } from "@/lib/content";
import { Flashcard } from "@/components/vocabulary/Flashcard";
import { TypingExercise } from "@/components/vocabulary/TypingExercise";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { sortBySpacedRepetition, getCategoryCounts, VocabCategory } from "@/lib/spaced-repetition";
import { Search, Brain, Grid3X3, Type, BrickWall, Clock, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TabMode = "categories" | "trainer" | "type" | "build" | "all";

const categoryLabels: Record<VocabCategory, { label: string; color: string; icon: React.ReactNode }> = {
  due: { label: "Wiederholen", color: "bg-danger text-white", icon: <Clock className="h-4 w-4" /> },
  new: { label: "Neu", color: "bg-primary text-white", icon: <BookOpen className="h-4 w-4" /> },
  learning: { label: "Lernen", color: "bg-yellow-500 text-white", icon: <Brain className="h-4 w-4" /> },
  mastered: { label: "Gelernt", color: "bg-success text-white", icon: <Check className="h-4 w-4" /> },
};

export default function VocabularyPage() {
  const [mode, setMode] = useState<TabMode>("categories");
  const [search, setSearch] = useState("");
  const modules = getAllModules();
  const allVocab = getAllVocabulary();
  const progress = useProgressSafe();

  const filtered = allVocab.filter(
    (w) =>
      w.de.toLowerCase().includes(search.toLowerCase()) ||
      w.bg.toLowerCase().includes(search.toLowerCase())
  );

  // Use spaced repetition sorting for trainer modes
  const sortedWords = sortBySpacedRepetition(filtered, progress.vocabularyProgress);
  const trainerWords = sortedWords.slice(0, 30);
  const counts = getCategoryCounts(filtered, progress.vocabularyProgress);

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Vokabeltrainer</h1>
      <p className="mb-4 text-muted">Wiederhole und festige deinen Wortschatz.</p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => setMode("categories")}
          className={cn(
            "flex flex-col items-center rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "categories" ? "bg-primary text-white" : "bg-gray-100 text-warm-800"
          )}
        >
          <Grid3X3 className="h-5 w-5" />
          Kategorien
        </button>
        <button
          onClick={() => setMode("trainer")}
          className={cn(
            "flex flex-col items-center rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "trainer" ? "bg-primary text-white" : "bg-gray-100 text-warm-800"
          )}
        >
          <Brain className="h-5 w-5" />
          Karten
        </button>
        <button
          onClick={() => setMode("all")}
          className={cn(
            "flex flex-col items-center rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "all" ? "bg-primary text-white" : "bg-gray-100 text-warm-800"
          )}
        >
          <Search className="h-5 w-5" />
          Alle
        </button>
      </div>

      {(mode === "trainer" || mode === "type" || mode === "build") && (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            onClick={() => setMode("trainer")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors",
              mode === "trainer" ? "bg-white text-primary shadow-sm" : "text-muted"
            )}
          >
            <Brain className="h-4 w-4" /> Karten
          </button>
          <button
            onClick={() => setMode("type")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors",
              mode === "type" ? "bg-white text-primary shadow-sm" : "text-muted"
            )}
          >
            <Type className="h-4 w-4" /> Tippen
          </button>
          <button
            onClick={() => setMode("build")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors",
              mode === "build" ? "bg-white text-primary shadow-sm" : "text-muted"
            )}
          >
            <BrickWall className="h-4 w-4" /> Bauen
          </button>
        </div>
      )}

      {mode === "categories" && (
        <div className="grid gap-3">
          {modules.map((m) => (
            <Link
              key={m.moduleId}
              href={`/vokabeln/${m.moduleId}/`}
              className="card flex items-center justify-between transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="font-bold">{m.title}</p>
                <p className="text-sm text-muted">{m.lessons.length} Lektionen · {m.level}</p>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary">
                Öffnen
              </span>
            </Link>
          ))}
        </div>
      )}

      {mode === "trainer" && (
        <div className="space-y-4">
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(Object.keys(categoryLabels) as VocabCategory[]).map((cat) => (
              <div
                key={cat}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                  categoryLabels[cat].color
                )}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {categoryLabels[cat].icon}
                  {categoryLabels[cat].label}
                </span>
                <span className="font-bold">{counts[cat]}</span>
              </div>
            ))}
          </div>
          <Flashcard words={trainerWords} />
        </div>
      )}
      {mode === "type" && <TypingExercise words={trainerWords} mode="type" onExit={() => setMode("trainer")} />}
      {mode === "build" && <TypingExercise words={trainerWords} mode="build" onExit={() => setMode("trainer")} />}

      {mode === "all" && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Deutsch oder Bulgarisch suchen"
              aria-label="Wortschatz durchsuchen"
              className="input pl-10"
            />
          </div>
          <ul className="space-y-2">
            {filtered.map((w) => (
              <li key={w.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold" lang="bg">{w.bg}</p>
                  <p className="text-sm text-muted">{w.de}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
