"use client";

import { Exercise, QuizQuestion, MatchingPair, FillInSentence, SentenceBuilder } from "@/types";
import { QuizExercise } from "./QuizExercise";
import { MatchingExercise } from "./MatchingExercise";
import { FillInExercise } from "./FillInExercise";
import { SentenceBuilderExercise } from "./SentenceBuilderExercise";

interface ExerciseEngineProps {
  exercise: Exercise;
  onComplete: (correct: boolean) => void;
}

export function ExerciseEngine({ exercise, onComplete }: ExerciseEngineProps) {
  switch (exercise.type) {
    case "quiz":
      return (
        <QuizExercise
          questions={exercise.data as QuizQuestion[]}
          onComplete={onComplete}
        />
      );
    case "matching":
      return (
        <MatchingExercise
          pairs={exercise.data as MatchingPair[]}
          onComplete={onComplete}
        />
      );
    case "fill-in":
      return (
        <FillInExercise
          sentences={exercise.data as FillInSentence[]}
          onComplete={onComplete}
        />
      );
    case "sentence-builder":
      return (
        <SentenceBuilderExercise
          sentences={exercise.data as SentenceBuilder[]}
          onComplete={onComplete}
        />
      );
    default:
      return <p className="text-muted">Diese Übung ist noch nicht verfügbar.</p>;
  }
}
