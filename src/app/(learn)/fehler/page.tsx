"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { TypingExercise } from "@/components/vocabulary/TypingExercise";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllVocabulary } from "@/lib/content";
import { isOpenMistake, MISTAKE_CATEGORY_LABELS } from "@/lib/mistake-categories";

export default function MistakesPage() {
  const progress = useProgressSafe();
  const mistakes = getAllVocabulary()
    .filter((word) => isOpenMistake(progress.vocabularyProgress[word.id]))
    .sort((a, b) => (progress.vocabularyProgress[b.id]?.timesWrong ?? 0) - (progress.vocabularyProgress[a.id]?.timesWrong ?? 0));

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Fehler üben</h1>
      <p className="mb-6 text-muted">Rufe Wörter aktiv ab, die zuletzt schwer waren.</p>
      {mistakes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Offene Fehlerkategorien">
          {[...new Set(mistakes.map((word) => progress.vocabularyProgress[word.id]?.lastErrorCategory ?? "vocabulary"))].map((category) => (
            <span key={category} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary">{MISTAKE_CATEGORY_LABELS[category]}</span>
          ))}
        </div>
      )}
      {mistakes.length > 0 ? <TypingExercise words={mistakes} mode="type" /> : (
        <section className="card text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
          <h2 className="mb-2 text-lg font-bold">Keine offenen Fehler</h2>
          <p className="mb-5 text-sm text-muted">Neue Fehler erscheinen hier automatisch.</p>
          <Link href="/heute-lernen" className="font-medium text-primary">Heute lernen</Link>
        </section>
      )}
    </main>
  );
}
