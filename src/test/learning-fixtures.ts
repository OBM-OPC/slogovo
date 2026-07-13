import { ExerciseItemResult, ExerciseResult, ExerciseResultStatus, ExerciseType } from "@/types";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";

export function makeExerciseResult(
  statuses: ExerciseResultStatus[],
  options: {
    exerciseId?: string;
    exerciseType?: ExerciseType;
    productive?: boolean;
    attemptNumber?: number;
    required?: boolean;
    vocabularyIds?: string[];
  } = {}
): ExerciseResult {
  const startedAt = "2026-07-13T10:00:00.000Z";
  const itemResults: ExerciseItemResult[] = statuses.map((status, index) => buildExerciseItemResult({
    itemId: `item-${index + 1}`,
    userAnswer: status === "correct" ? "right" : "wrong",
    acceptedAnswers: ["right"],
    status,
    durationMs: 1000,
    startedAt,
    completedAt: "2026-07-13T10:00:01.000Z",
    attemptNumber: options.attemptNumber,
    required: options.required,
    productive: options.productive,
    vocabularyId: options.vocabularyIds?.[index],
  }));
  return buildExerciseResult({
    exerciseId: options.exerciseId ?? "exercise-1",
    exerciseType: options.exerciseType ?? "quiz",
    itemResults,
    startedAt,
    completedAt: "2026-07-13T10:00:02.000Z",
  });
}
