"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { getAllVocabulary } from "@/lib/content";
import { useProgressStore } from "@/stores/useProgressStore";
import { LocalRecorder } from "@/components/speaking/LocalRecorder";

export default function SpeakingPage() {
  const progress = useProgressSafe();
  const review = useProgressStore((state) => state.reviewVocabularyWithDifficulty);
  const words = getAllVocabulary().slice(0, 20);
  const [index, setIndex] = useState(0);
  const word = words[index % words.length];

  if (!word) {
    return (
      <main className="animate-fade-in px-4 py-6 safe-top">
        <h1 className="mb-2 text-2xl font-bold">Sprechen</h1>
        <p className="text-muted">Für die Sprechübung sind noch keine Wörter verfügbar.</p>
      </main>
    );
  }

  const rate = async (rating: "repeat" | "good") => {
    await review(word.id, rating, "production");
    setIndex((value) => value + 1);
  };

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Sprechen</h1>
      <p className="mb-6 text-muted">Höre, sprich nach und bewerte dich ehrlich.</p>
      <section className="card text-center">
        <p className="mb-2 text-sm text-muted">{word.de}</p>
        <p className="mb-5 text-3xl font-bold" lang="bg">{word.bg}</p>
        <div className="mb-5"><SpeakButton text={word.bg} progress={progress} label="Beispiel anhören" /></div>
        {word.bg.split(/\s+/).length > 1 && (
          <div className="mb-5">
            <p className="mb-2 text-xs text-muted">Wort für Wort</p>
            <div className="flex flex-wrap justify-center gap-2">{word.bg.split(/\s+/).map((token, tokenIndex) => <SpeakButton key={`${token}-${tokenIndex}`} text={token} progress={progress} label={token} />)}</div>
          </div>
        )}
        {(word.pronunciationHint || word.stressPosition) && <p className="mb-5 rounded-xl bg-primary-50 p-3 text-sm text-primary">{word.pronunciationHint ?? `Betonung: Silbe ${word.stressPosition}`}</p>}
        <div className="mb-5"><LocalRecorder /></div>
        <p className="mb-5 rounded-xl bg-gray-50 p-3 text-sm text-muted">Keine automatische Aussprache-Punktzahl – deine Selbsteinschätzung zählt.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => void rate("repeat")}><RotateCcw className="h-4 w-4" /> Nochmal</Button>
          <Button onClick={() => void rate("good")}><Check className="h-4 w-4" /> Geschafft</Button>
        </div>
      </section>
    </main>
  );
}
