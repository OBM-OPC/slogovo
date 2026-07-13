"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Flashcard } from "@/components/vocabulary/Flashcard";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllVocabulary } from "@/lib/content";
import { isDueForReview } from "@/lib/spaced-repetition";

export default function ReviewPage() {
  const progress = useProgressSafe();
  const dueWords = getAllVocabulary().filter((word) => {
    const item = progress.vocabularyProgress[word.id];
    return item && isDueForReview(item);
  });

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Wiederholen</h1>
      <p className="mb-6 text-muted">Fällige Vokabeln, ohne neue Inhalte.</p>
      {dueWords.length > 0 ? <Flashcard words={dueWords} /> : (
        <section className="card text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
          <h2 className="mb-2 text-lg font-bold">Alles wiederholt</h2>
          <p className="mb-5 text-sm text-muted">Im Moment ist keine Vokabel fällig.</p>
          <Link href="/heute-lernen" className="font-medium text-primary">Heute lernen</Link>
        </section>
      )}
    </main>
  );
}
