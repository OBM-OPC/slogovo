"use client";

import { useState } from "react";
import { QuizQuestion } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/useProgressStore";

interface QuizExerciseProps {
  questions: QuizQuestion[];
  onComplete: (correct: boolean) => void;
}

export function QuizExercise({ questions, onComplete }: QuizExerciseProps) {
  const addExerciseResult = useProgressStore((state) => state.addExerciseResult);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const question = questions[current];

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    const isCorrect = index === question.correctOptionIndex;
    if (isCorrect) {
      // count could be tracked here for analytics
    }
    addExerciseResult(isCorrect);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      onComplete(true);
    }
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium">{question.question}</p>
      {question.bg && (
        <p className="mb-4 text-xl font-semibold text-primary">{question.bg}</p>
      )}
      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctOptionIndex;
          const stateClass =
            showResult && isCorrect
              ? "border-success bg-success/10 text-success"
              : showResult && isSelected && !isCorrect
              ? "border-danger bg-danger/10 text-danger"
              : isSelected
              ? "border-primary bg-primary/10 text-primary"
              : "border-gray-200 bg-white hover:bg-gray-50";

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={cn(
                "w-full rounded-xl border-2 p-4 text-left font-medium transition-colors",
                stateClass
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-6">
          <Button onClick={handleNext} fullWidth>
            {current < questions.length - 1 ? "Weiter" : "Fertig"}
          </Button>
        </div>
      )}
    </div>
  );
}
