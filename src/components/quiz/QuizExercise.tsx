"use client";

import { useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, QuizQuestion } from "@/types";
import { Button } from "@/components/ui/Button";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { cn } from "@/lib/utils";

interface QuizExerciseProps {
  exerciseId: string;
  questions: QuizQuestion[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onComplete: (result: ExerciseResult) => void;
}

export function QuizExercise({
  exerciseId,
  questions,
  attemptNumber = 1,
  onInteraction,
  onComplete,
}: QuizExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const question = questions[current];

  const handleSelect = (index: number) => {
    if (showResult) return;
    onInteraction?.();
    const completedAt = new Date().toISOString();
    itemResults.current.push(buildExerciseItemResult({
      itemId: question.id,
      userAnswer: question.options[index],
      acceptedAnswers: [question.options[question.correctOptionIndex]],
      status: index === question.correctOptionIndex ? "correct" : "wrong",
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current),
      startedAt: itemStartedAt.current,
      completedAt,
      attemptNumber,
      required: question.required,
      productive: false,
    }));
    setSelected(index);
    setShowResult(true);
  };

  const handleNext = () => {
    onInteraction?.();
    if (current < questions.length - 1) {
      setCurrent((value) => value + 1);
      setSelected(null);
      setShowResult(false);
      itemStartedAt.current = new Date().toISOString();
      return;
    }
    onComplete(buildExerciseResult({
      exerciseId,
      exerciseType: "quiz",
      itemResults: itemResults.current,
      startedAt: exerciseStartedAt.current,
    }));
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium">{question.question}</p>
      {question.bg && <p className="mb-4 text-xl font-semibold text-primary">{question.bg}</p>}
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === question.correctOptionIndex;
          const stateClass = showResult && isCorrect
            ? "border-success bg-success/10 text-success"
            : showResult && isSelected
              ? "border-danger bg-danger/10 text-danger"
              : isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 bg-white hover:bg-gray-50";
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={showResult}
              aria-pressed={isSelected}
              aria-label={`${option}${showResult && isCorrect ? ", richtig" : showResult && isSelected ? ", falsch" : ""}`}
              className={cn("min-h-12 w-full rounded-xl border-2 p-4 text-left font-medium transition-colors", stateClass)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className="mt-6 space-y-3">
          {question.explanation && (
            <div className={cn(
              "rounded-xl p-4 text-sm",
              selected === question.correctOptionIndex ? "bg-success/10 text-success" : "bg-warm-50 text-muted"
            )}>
              <p className="font-medium">{question.explanation}</p>
              {question.grammarTopicSlug && (
                <a href={`/grammatik/${question.grammarTopicSlug}`} className="mt-2 inline-block text-sm text-primary underline">
                  Zum Grammatikthema
                </a>
              )}
            </div>
          )}
          <Button onClick={handleNext} fullWidth>
            {current < questions.length - 1 ? "Weiter" : "Fertig"}
          </Button>
        </div>
      )}
    </div>
  );
}
