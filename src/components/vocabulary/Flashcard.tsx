"use client";

import { useState } from "react";
import { VocabularyItem } from "@/types";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { Button } from "@/components/ui/Button";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti } from "@/lib/confetti";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  words: VocabularyItem[];
}

export function Flashcard({ words }: FlashcardProps) {
  const progress = useProgressSafe();
  const reviewVocabulary = useProgressStore((state) => state.reviewVocabulary);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);

  if (words.length === 0) {
    return <p className="text-center text-muted">Keine Vokabeln verfügbar.</p>;
  }

  if (finished) {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-xl font-bold">Geschafft! 🎉</h2>
        <p className="mb-4 text-muted">Du hast alle Karten in dieser Runde gesehen.</p>
        <Button onClick={() => { setIndex(0); setFlipped(false); setFinished(false); }} fullWidth>
          Noch einmal
        </Button>
      </div>
    );
  }

  const word = words[index];

  const handleKnown = (known: boolean) => {
    reviewVocabulary(word.id, known);
    if (known) {
      const nextStreak = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextStreak);
      vibrateCorrect(nextStreak);
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        triggerConfetti({ scalar: 1 + Math.min(nextStreak, 10) * 0.05 });
      }
    } else {
      setConsecutiveCorrect(0);
      vibrateWrong();
    }
    if (index < words.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "card relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center text-center transition-transform duration-300",
          flipped && "scale-[1.02]"
        )}
      >
        <div className="absolute right-4 top-4">
          <SpeakButton text={word.bg} progress={progress} size="md" />
        </div>

        <div className="text-sm text-muted">{flipped ? "Bulgarisch → Deutsch" : "Deutsch → Bulgarisch"}</div>

        {flipped ? (
          <div className="animate-fade-in">
            <p className="mb-2 text-4xl font-bold text-primary">{word.bg}</p>
            {progress.settings.showLatin && word.bgLatin && (
              <p className="text-sm italic text-muted">{word.bgLatin}</p>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-2xl font-semibold">{word.de}</p>
            <p className="mt-2 text-sm text-muted">Tippen zum Aufdecken</p>
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted">
          Karte {index + 1} / {words.length}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleKnown(false)}
          fullWidth
          className="border-danger text-danger hover:bg-danger/10"
        >
          <X className="h-5 w-5" /> Nicht gewusst
        </Button>
        <Button
          onClick={() => handleKnown(true)}
          fullWidth
        >
          <Check className="h-5 w-5" /> Gewusst
        </Button>
      </div>
    </div>
  );
}
