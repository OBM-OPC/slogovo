"use client";

import Link from "next/link";
import { ModuleMeta, VocabularyItem } from "@/types";
import { Flashcard } from "./Flashcard";
import { ArrowLeft } from "lucide-react";
import { getCategoryCounts, VocabCategory } from "@/lib/spaced-repetition";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { cn } from "@/lib/utils";

interface VocabularyCategoryClientProps {
  moduleMeta: ModuleMeta;
  words: VocabularyItem[];
}

const categoryLabels: Record<VocabCategory, { label: string; color: string }> = {
  due: { label: "Wiederholen", color: "bg-danger text-white" },
  new: { label: "Neu", color: "bg-primary text-white" },
  learning: { label: "Lernen", color: "bg-yellow-500 text-white" },
  mastered: { label: "Gelernt", color: "bg-success text-white" },
};

export function VocabularyCategoryClient({ moduleMeta, words }: VocabularyCategoryClientProps) {
  const progress = useProgressSafe();
  const counts = getCategoryCounts(words, progress.vocabularyProgress);

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/vokabeln/" className="rounded-full bg-gray-100 p-2 text-muted hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-muted">{moduleMeta.level}</p>
          <h1 className="text-xl font-bold">{moduleMeta.title}</h1>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {(Object.keys(categoryLabels) as VocabCategory[]).map((cat) => (
          <div
            key={cat}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
              categoryLabels[cat].color
            )}
          >
            <span className="font-medium">{categoryLabels[cat].label}</span>
            <span className="font-bold">{counts[cat]}</span>
          </div>
        ))}
      </div>

      <Flashcard words={words} />
    </main>
  );
}
