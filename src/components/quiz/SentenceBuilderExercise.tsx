"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, SentenceBuilder } from "@/types";
import { Button } from "@/components/ui/Button";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { cn } from "@/lib/utils";

interface SentenceBuilderExerciseProps {
  exerciseId: string;
  sentences: SentenceBuilder[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function SentenceBuilderExercise({
  exerciseId,
  sentences,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onComplete,
}: SentenceBuilderExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const sentence = sentences[current];
  const available = sentence.words.filter((word) => !selected.includes(word));
  const isCorrect = selected.length === sentence.correctOrder.length && selected.every((word, index) => word === sentence.correctOrder[index]);

  useEffect(() => onItemChange?.(current, sentences.length), [current, onItemChange, sentences.length]);

  const checkAnswer = () => {
    if (showResult || selected.length !== sentence.correctOrder.length) return;
    onInteraction?.();
    const completedAt = new Date().toISOString();
    itemResults.current.push(buildExerciseItemResult({
      itemId: sentence.id,
      userAnswer: selected.join(" "),
      acceptedAnswers: [sentence.correctOrder.join(" ")],
      status: isCorrect ? "correct" : "wrong",
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current),
      startedAt: itemStartedAt.current,
      completedAt,
      attemptNumber,
      required: sentence.required,
      productive: true,
      feedback: sentence.explanation,
    }));
    setShowResult(true);
  };

  const handleNext = () => {
    onInteraction?.();
    if (current < sentences.length - 1) {
      setCurrent((value) => value + 1);
      setSelected([]);
      setShowResult(false);
      itemStartedAt.current = new Date().toISOString();
      return;
    }
    onComplete(buildExerciseResult({
      exerciseId,
      exerciseType: "sentence-builder",
      itemResults: itemResults.current,
      startedAt: exerciseStartedAt.current,
    }));
  };

  return (
    <div>
      <p className="mb-2 text-muted">Baue den bulgarischen Satz:</p>
      {sentence.de && <p className="mb-4 font-medium">„{sentence.de}“</p>}
      <div aria-label="Gebauter Satz" aria-live="polite" className="mb-4 min-h-[56px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3">
        {selected.length === 0 ? <p className="text-center text-sm text-muted">Tippe die Wörter in der richtigen Reihenfolge an.</p> : (
          <div className="flex flex-wrap gap-2">
            {selected.map((word, index) => (
              <button
                key={`${index}-${word}`}
                type="button"
                onClick={() => { onInteraction?.(); setSelected((items) => items.filter((_, itemIndex) => itemIndex !== index)); }}
                disabled={showResult}
                aria-label={`${word} aus Position ${index + 1} entfernen`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  showResult ? (word === sentence.correctOrder[index] ? "bg-success/20 text-success" : "bg-danger/20 text-danger") : "bg-white shadow-sm hover:bg-gray-100"
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
            type="button"
            onClick={() => { onInteraction?.(); setSelected((items) => [...items, word]); }}
            disabled={showResult}
            aria-label={`${word} zum Satz hinzufügen`}
            className="min-h-14 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary-100 disabled:opacity-50"
          >
            {word}
          </button>
        ))}
      </div>
      {!showResult ? (
        <Button className="lesson-action" onClick={checkAnswer} fullWidth disabled={selected.length !== sentence.correctOrder.length}>Prüfen</Button>
      ) : (
        <div className="space-y-3">
          {sentence.explanation && (
            <div className={cn("rounded-xl p-4 text-sm", isCorrect ? "bg-success/10 text-success" : "bg-warm-50 text-muted")}>
              <p className="font-medium">{sentence.explanation}</p>
              {sentence.grammarTopicSlug && <a href={`/grammatik/${sentence.grammarTopicSlug}`} className="mt-2 inline-block text-sm text-primary underline">Zum Grammatikthema</a>}
            </div>
          )}
          <div role="status" aria-live="polite" className={cn("rounded-xl p-4 text-center font-medium", isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            {isCorrect ? "Richtig!" : `Richtige Reihenfolge: ${sentence.correctOrder.join(" ")}`}
          </div>
          <Button className="lesson-action" onClick={handleNext} fullWidth>{current < sentences.length - 1 ? "Weiter" : "Fertig"}</Button>
        </div>
      )}
    </div>
  );
}
