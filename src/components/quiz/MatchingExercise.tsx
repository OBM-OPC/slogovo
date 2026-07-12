"use client";

import { useState } from "react";
import { MatchingPair } from "@/types";
import { useProgressStore } from "@/stores/useProgressStore";
import { cn, shuffleArray } from "@/lib/utils";

interface MatchingExerciseProps {
  pairs: MatchingPair[];
  onComplete: () => void;
}

export function MatchingExercise({ pairs, onComplete }: MatchingExerciseProps) {
  const addExerciseResult = useProgressStore((state) => state.addExerciseResult);
  const [selectedDe, setSelectedDe] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());

  const [bgOptions, setBgOptions] = useState<string[]>(() => shuffleArray(pairs.map((p) => p.bg)));

  const [anyWrong, setAnyWrong] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<{ text?: string; grammarTopicSlug?: string }>({});

  const handleDeClick = (de: string) => {
    if (selectedDe === de) {
      setSelectedDe(null);
    } else {
      setSelectedDe(de);
    }
  };

  const handleBgClick = (bg: string) => {
    if (!selectedDe || matched.has(selectedDe)) return;
    const pair = pairs.find((p) => p.de === selectedDe);
    const isCorrect = pair?.bg === bg;
    if (isCorrect) {
      setMatched((prev) => new Set([...prev, selectedDe]));
      setLastExplanation({ text: pair?.explanation, grammarTopicSlug: pair?.grammarTopicSlug });
      setSelectedDe(null);
    } else {
      setWrong((prev) => new Set([...prev, selectedDe, bg]));
      setAnyWrong(true);
      const rightPair = pairs.find((p) => p.de === selectedDe);
      setLastExplanation({
        text: rightPair?.explanation,
        grammarTopicSlug: rightPair?.grammarTopicSlug,
      });
      setTimeout(() => {
        setWrong((prev) => {
          const next = new Set(prev);
          next.delete(selectedDe);
          next.delete(bg);
          return next;
        });
      }, 600);
      setSelectedDe(null);
    }
    addExerciseResult(isCorrect);

    if (matched.size + (isCorrect ? 1 : 0) === pairs.length) {
      setBgOptions([]);
      onComplete();
    }
  };

  return (
    <div>
      <p className="mb-4 text-muted">Tippe ein deutsches Wort an und dann die passende bulgarische Übersetzung.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((pair) => (
            <button
              key={pair.id}
              disabled={matched.has(pair.de)}
              onClick={() => handleDeClick(pair.de)}
              className={cn(
                "w-full rounded-xl border-2 p-3 text-left text-sm font-medium transition-colors",
                matched.has(pair.de)
                  ? "border-success bg-success/10 text-success"
                  : selectedDe === pair.de
                  ? "border-primary bg-primary/10 text-primary"
                  : wrong.has(pair.de)
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              )}
            >
              {pair.de}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {bgOptions.map((bg) => (
            <button
              key={bg}
              disabled={matched.has(pairs.find((p) => p.bg === bg)?.de || "")}
              onClick={() => handleBgClick(bg)}
              className={cn(
                "w-full rounded-xl border-2 p-3 text-center text-base font-medium transition-colors",
                matched.has(pairs.find((p) => p.bg === bg)?.de || "")
                  ? "border-success bg-success/10 text-success"
                  : wrong.has(bg)
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              )}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>
      {lastExplanation.text && (
        <div className="mt-4 rounded-xl bg-warm-50 p-4 text-sm text-muted">
          <p className="font-medium">{lastExplanation.text}</p>
          {lastExplanation.grammarTopicSlug && (
            <a
              href={`/grammatik/${lastExplanation.grammarTopicSlug}`}
              className="mt-2 inline-block text-sm text-primary underline"
            >
              Zum Grammatikthema
            </a>
          )}
        </div>
      )}
    </div>
  );
}
