"use client";

import { useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, MatchingPair } from "@/types";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { cn, shuffleArray } from "@/lib/utils";

interface MatchingExerciseProps {
  exerciseId: string;
  pairs: MatchingPair[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onComplete: (result: ExerciseResult) => void;
}

export function MatchingExercise({
  exerciseId,
  pairs,
  attemptNumber = 1,
  onInteraction,
  onComplete,
}: MatchingExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Map(pairs.map((pair) => [pair.id, new Date().toISOString()])));
  const itemAttempts = useRef(new Map<string, number>());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [selectedDe, setSelectedDe] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [lastExplanation, setLastExplanation] = useState<{ text?: string; grammarTopicSlug?: string }>({});
  const [bgOptions] = useState(() => shuffleArray(pairs.map((pair) => pair.bg)));

  const handleDeClick = (de: string) => {
    onInteraction?.();
    setSelectedDe((current) => current === de ? null : de);
  };

  const handleBgClick = (bg: string) => {
    if (!selectedDe || matched.has(selectedDe)) return;
    onInteraction?.();
    const selectedPair = pairs.find((pair) => pair.de === selectedDe);
    if (!selectedPair) return;
    const selectedValue = selectedDe;
    const isCorrect = selectedPair.bg === bg;
    const completedAt = new Date().toISOString();
    const localAttempt = (itemAttempts.current.get(selectedPair.id) ?? 0) + 1;
    itemAttempts.current.set(selectedPair.id, localAttempt);
    itemResults.current.push(buildExerciseItemResult({
      itemId: selectedPair.id,
      userAnswer: bg,
      acceptedAnswers: [selectedPair.bg],
      status: isCorrect ? "correct" : "wrong",
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current.get(selectedPair.id) ?? completedAt),
      startedAt: itemStartedAt.current.get(selectedPair.id) ?? completedAt,
      completedAt,
      attemptNumber: attemptNumber + localAttempt - 1,
      required: selectedPair.required,
      productive: false,
      feedback: selectedPair.explanation,
    }));
    itemStartedAt.current.set(selectedPair.id, completedAt);
    setLastExplanation({ text: selectedPair.explanation, grammarTopicSlug: selectedPair.grammarTopicSlug });
    setSelectedDe(null);

    if (isCorrect) {
      const nextMatched = new Set([...matched, selectedValue]);
      setMatched(nextMatched);
      if (nextMatched.size === pairs.length) {
        onComplete(buildExerciseResult({
          exerciseId,
          exerciseType: "matching",
          itemResults: itemResults.current,
          startedAt: exerciseStartedAt.current,
        }));
      }
      return;
    }

    setWrong((current) => new Set([...current, selectedValue, bg]));
    window.setTimeout(() => {
      setWrong((current) => {
        const next = new Set(current);
        next.delete(selectedValue);
        next.delete(bg);
        return next;
      });
    }, 600);
  };

  return (
    <div>
      <p className="mb-4 text-muted">Tippe ein deutsches Wort an und dann die passende bulgarische Übersetzung.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((pair) => (
            <button
              key={pair.id}
              type="button"
              disabled={matched.has(pair.de)}
              onClick={() => handleDeClick(pair.de)}
              className={cn(
                "w-full rounded-xl border-2 p-3 text-left text-sm font-medium transition-colors",
                matched.has(pair.de) ? "border-success bg-success/10 text-success"
                  : selectedDe === pair.de ? "border-primary bg-primary/10 text-primary"
                    : wrong.has(pair.de) ? "border-danger bg-danger/10 text-danger"
                      : "border-gray-200 bg-white hover:bg-gray-50"
              )}
            >
              {pair.de}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {bgOptions.map((bg) => {
            const de = pairs.find((pair) => pair.bg === bg)?.de ?? "";
            return (
              <button
                key={bg}
                type="button"
                disabled={matched.has(de)}
                onClick={() => handleBgClick(bg)}
                className={cn(
                  "w-full rounded-xl border-2 p-3 text-center text-base font-medium transition-colors",
                  matched.has(de) ? "border-success bg-success/10 text-success"
                    : wrong.has(bg) ? "border-danger bg-danger/10 text-danger"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                {bg}
              </button>
            );
          })}
        </div>
      </div>
      {(lastExplanation.text || lastExplanation.grammarTopicSlug) && (
        <div className="mt-4 rounded-xl bg-warm-50 p-4 text-sm text-muted">
          {lastExplanation.text && <p className="font-medium">{lastExplanation.text}</p>}
          {lastExplanation.grammarTopicSlug && (
            <a href={`/grammatik/${lastExplanation.grammarTopicSlug}`} className="mt-2 inline-block text-sm text-primary underline">Zum Grammatikthema</a>
          )}
        </div>
      )}
    </div>
  );
}
