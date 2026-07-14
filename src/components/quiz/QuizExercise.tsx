"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, QuizQuestion } from "@/types";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { cn } from "@/lib/utils";
import { ExerciseFeedback } from "./ExerciseFeedback";

interface QuizExerciseProps {
  exerciseId: string;
  questions: QuizQuestion[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onReviewRequest?: (itemId: string) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function QuizExercise({
  exerciseId,
  questions,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onReviewRequest,
  onComplete,
}: QuizExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const question = questions[current];
  const correctAnswer = question.options[question.correctOptionIndex];
  const audioText = /[\u0400-\u04ff]/u.test(correctAnswer)
    ? correctAnswer
    : question.bg || question.question.match(/[\u0400-\u04ff][\u0400-\u04ff\s?!.,-]*/u)?.[0];

  useEffect(() => onItemChange?.(current, questions.length), [current, onItemChange, questions.length]);

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
              className={cn("min-h-14 w-full rounded-xl border-2 p-4 text-left font-medium transition-colors duration-200", stateClass)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {showResult && <ExerciseFeedback
        correct={selected === question.correctOptionIndex}
        correctAnswer={correctAnswer}
        explanation={question.explanation}
        grammarTopicSlug={question.grammarTopicSlug}
        audioText={audioText}
        nextLabel={current < questions.length - 1 ? "Weiter" : "Fertig"}
        onNext={handleNext}
        onAddToReview={selected !== question.correctOptionIndex ? () => onReviewRequest?.(question.id) : undefined}
      />}
    </div>
  );
}
