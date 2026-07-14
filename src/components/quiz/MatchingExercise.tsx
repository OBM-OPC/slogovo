"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, MatchingPair } from "@/types";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { cn, shuffleArray } from "@/lib/utils";
import { ExerciseFeedback } from "./ExerciseFeedback";

interface MatchingExerciseProps {
  exerciseId: string;
  pairs: MatchingPair[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onReviewRequest?: (itemId: string) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function MatchingExercise({
  exerciseId,
  pairs,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onReviewRequest,
  onComplete,
}: MatchingExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Map(pairs.map((pair) => [pair.id, new Date().toISOString()])));
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [selectedDe, setSelectedDe] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{
    itemId: string;
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
    grammarTopicSlug?: string;
    completeAfter: boolean;
  } | null>(null);
  const [bgOptions] = useState(() => shuffleArray(pairs.map((pair) => pair.bg)));

  useEffect(() => onItemChange?.(matched.size, pairs.length), [matched.size, onItemChange, pairs.length]);

  const handleDeClick = (de: string) => {
    if (feedback) return;
    onInteraction?.();
    setSelectedDe((current) => current === de ? null : de);
  };

  const handleBgClick = (bg: string) => {
    if (feedback || !selectedDe || matched.has(selectedDe)) return;
    onInteraction?.();
    const selectedPair = pairs.find((pair) => pair.de === selectedDe);
    if (!selectedPair) return;
    const selectedValue = selectedDe;
    const isCorrect = selectedPair.bg === bg;
    const completedAt = new Date().toISOString();
    itemResults.current.push(buildExerciseItemResult({
      itemId: selectedPair.id,
      userAnswer: bg,
      acceptedAnswers: [selectedPair.bg],
      status: isCorrect ? "correct" : "wrong",
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current.get(selectedPair.id) ?? completedAt),
      startedAt: itemStartedAt.current.get(selectedPair.id) ?? completedAt,
      completedAt,
      // Selections inside one matching screen belong to the same lesson-flow attempt.
      // Deferred retries increment the attempt number after the screen completes.
      attemptNumber,
      required: selectedPair.required,
      productive: false,
      feedback: selectedPair.explanation,
    }));
    itemStartedAt.current.set(selectedPair.id, completedAt);
    setSelectedDe(null);

    if (isCorrect) {
      const nextMatched = new Set([...matched, selectedValue]);
      setMatched(nextMatched);
      setFeedback({ itemId: selectedPair.id, correct: true, correctAnswer: selectedPair.bg, explanation: selectedPair.explanation, grammarTopicSlug: selectedPair.grammarTopicSlug, completeAfter: nextMatched.size === pairs.length });
      return;
    }

    setWrong((current) => new Set([...current, selectedValue, bg]));
    setFeedback({ itemId: selectedPair.id, correct: false, correctAnswer: selectedPair.bg, explanation: selectedPair.explanation, grammarTopicSlug: selectedPair.grammarTopicSlug, completeAfter: false });
  };

  const dismissFeedback = () => {
    if (!feedback) return;
    if (feedback.completeAfter) {
      onComplete(buildExerciseResult({
        exerciseId,
        exerciseType: "matching",
        itemResults: itemResults.current,
        startedAt: exerciseStartedAt.current,
      }));
      return;
    }
    setWrong(new Set());
    setFeedback(null);
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
              disabled={Boolean(feedback) || matched.has(pair.de)}
              onClick={() => handleDeClick(pair.de)}
              aria-pressed={selectedDe === pair.de}
              aria-label={`${pair.de}${matched.has(pair.de) ? ", zugeordnet" : wrong.has(pair.de) ? ", falsch" : ""}`}
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
                disabled={Boolean(feedback) || matched.has(de)}
                onClick={() => handleBgClick(bg)}
                aria-label={`${bg}${matched.has(de) ? ", zugeordnet" : wrong.has(bg) ? ", falsch" : ""}`}
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
      {feedback && <ExerciseFeedback
        correct={feedback.correct}
        correctAnswer={feedback.correctAnswer}
        explanation={feedback.explanation}
        grammarTopicSlug={feedback.grammarTopicSlug}
        audioText={feedback.correctAnswer}
        nextLabel={feedback.completeAfter ? "Fertig" : "Weiter"}
        onNext={dismissFeedback}
        onAddToReview={!feedback.correct ? () => onReviewRequest?.(feedback.itemId) : undefined}
      />}
    </div>
  );
}
