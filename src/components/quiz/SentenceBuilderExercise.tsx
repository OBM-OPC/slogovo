"use client";

import { useState } from "react";
import { SentenceBuilder } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/stores/useProgressStore";
import { cn } from "@/lib/utils";

interface SentenceBuilderExerciseProps {
  sentences: SentenceBuilder[];
  onComplete: (correct: boolean) => void;
}

export function SentenceBuilderExercise({ sentences, onComplete }: SentenceBuilderExerciseProps) {
  const addExerciseResult = useProgressStore((state) => state.addExerciseResult);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const [anyWrong, setAnyWrong] = useState(false);

  const sentence = sentences[current];
  const available = sentence.words.filter((w) => !selected.includes(w));

  const handleWordClick = (word: string) => {
    if (showResult) return;
    setSelected((prev) => [...prev, word]);
  };

  const handleRemove = (index: number) => {
    if (showResult) return;
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const checkAnswer = () => {
    const isCorrect =
      selected.length === sentence.correctOrder.length &&
      selected.every((w, i) => w === sentence.correctOrder[i]);
    setShowResult(true);
    if (!isCorrect) setAnyWrong(true);
    addExerciseResult(isCorrect);
  };

  const handleNext = () => {
    if (current < sentences.length - 1) {
      setCurrent((c) => c + 1);
      setSelected([]);
      setShowResult(false);
    } else {
      onComplete(!anyWrong);
    }
  };

  return (
    <div>
      <p className="mb-2 text-muted">Baue den bulgarischen Satz:</p>
      {sentence.de && <p className="mb-4 font-medium">„{sentence.de}“</p>}

      <div className="mb-4 min-h-[56px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3">
        {selected.length === 0 ? (
          <p className="text-center text-sm text-muted">Tippe die Wörter in der richtigen Reihenfolge an.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((word, idx) => (
              <button
                key={`${idx}-${word}`}
                onClick={() => handleRemove(idx)}
                disabled={showResult}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  showResult
                    ? word === sentence.correctOrder[idx]
                      ? "bg-success/20 text-success"
                      : "bg-danger/20 text-danger"
                    : "bg-white shadow-sm hover:bg-gray-100"
                )}
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {available.map((word) => (
          <button
            key={word}
            onClick={() => handleWordClick(word)}
            disabled={showResult}
            className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-100 disabled:opacity-50"
          >
            {word}
          </button>
        ))}
      </div>

      {!showResult ? (
        <Button onClick={checkAnswer} fullWidth disabled={selected.length !== sentence.correctOrder.length}>
          Prüfen
        </Button>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "rounded-xl p-4 text-center font-medium",
              selected.join(" ") === sentence.correctOrder.join(" ")
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {selected.join(" ") === sentence.correctOrder.join(" ")
              ? "Richtig!"
              : `Richtige Reihenfolge: ${sentence.correctOrder.join(" ")}`}
          </div>
          <Button onClick={handleNext} fullWidth>
            {current < sentences.length - 1 ? "Weiter" : "Fertig"}
          </Button>
        </div>
      )}
    </div>
  );
}
