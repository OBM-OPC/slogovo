"use client";

import {
  Exercise,
  ExerciseResult,
  FillInSentence,
  ListenExerciseItem,
  MatchingPair,
  QuizQuestion,
  SentenceBuilder,
} from "@/types";
import { FillInExercise } from "./FillInExercise";
import { ListenExercise } from "./ListenExercise";
import { MatchingExercise } from "./MatchingExercise";
import { QuizExercise } from "./QuizExercise";
import { SentenceBuilderExercise } from "./SentenceBuilderExercise";

interface ExerciseEngineProps {
  exercise: Exercise;
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseEngine({
  exercise,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onComplete,
}: ExerciseEngineProps) {
  const shared = { exerciseId: exercise.id, attemptNumber, onInteraction, onItemChange, onComplete };

  switch (exercise.type) {
    case "quiz":
      return <QuizExercise {...shared} questions={exercise.data as QuizQuestion[]} />;
    case "matching":
      return <MatchingExercise {...shared} pairs={exercise.data as MatchingPair[]} />;
    case "fill-in":
      return <FillInExercise {...shared} sentences={exercise.data as FillInSentence[]} />;
    case "sentence-builder":
      return <SentenceBuilderExercise {...shared} sentences={exercise.data as SentenceBuilder[]} />;
    case "listen":
      return <ListenExercise {...shared} items={exercise.data as ListenExerciseItem[]} />;
  }
}
