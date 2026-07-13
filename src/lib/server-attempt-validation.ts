import type {
  Exercise,
  ExerciseResult,
  FillInSentence,
  Lesson,
  ListenExerciseItem,
  MatchingPair,
  QuizQuestion,
  SentenceBuilder,
} from "@/types";
import {
  authoredAnswerOptions,
  evaluateAnswerDetailed,
  type AnswerEvaluationOptions,
} from "./answer-evaluation";
import { buildExerciseItemResult, buildExerciseResult } from "./evaluation";
import { buildEvaluationFeedback, formatRichFeedback } from "./feedback";
import { LearningValidationError } from "./learning-errors";

type ExerciseDataItem =
  | QuizQuestion
  | MatchingPair
  | FillInSentence
  | SentenceBuilder
  | ListenExerciseItem;

interface ExpectedAnswer {
  item: ExerciseDataItem;
  options: AnswerEvaluationOptions;
  acceptedAnswers: string[];
  explanation?: string;
  vocabularyId?: string;
}

function itemId(item: ExerciseDataItem): string {
  return item.id;
}

function exerciseItems(exercise: Exercise): ExerciseDataItem[] {
  return exercise.data as ExerciseDataItem[];
}

function expectedAnswer(exercise: Exercise, id: string): ExpectedAnswer {
  const item = exerciseItems(exercise).find((candidate) => itemId(candidate) === id);
  if (!item) {
    throw new LearningValidationError(
      "UNKNOWN_ITEM",
      `Unknown item '${id}' for exercise '${exercise.id}'`,
      `${exercise.id}:${id}`
    );
  }

  if (exercise.type === "quiz") {
    const question = item as QuizQuestion;
    const answer = question.options[question.correctOptionIndex];
    return {
      item,
      options: { acceptedAnswers: [answer], strict: true },
      acceptedAnswers: [answer],
      explanation: question.explanation,
    };
  }
  if (exercise.type === "matching") {
    const pair = item as MatchingPair;
    return {
      item,
      options: { acceptedAnswers: [pair.bg], strict: true },
      acceptedAnswers: [pair.bg],
      explanation: pair.explanation,
    };
  }
  if (exercise.type === "fill-in") {
    const sentence = item as FillInSentence;
    return {
      item,
      options: {
        ...authoredAnswerOptions(sentence.answer, sentence.answers),
        allowOmittedSubjectPronoun: sentence.allowOmittedSubjectPronoun,
      },
      acceptedAnswers: sentence.answers,
      explanation: sentence.explanation,
    };
  }
  if (exercise.type === "sentence-builder") {
    const sentence = item as SentenceBuilder;
    const answer = sentence.correctOrder.join(" ");
    return {
      item,
      options: { acceptedAnswers: [answer], strict: true },
      acceptedAnswers: [answer],
      explanation: sentence.explanation,
    };
  }

  const listen = item as ListenExerciseItem;
  const common = { item, vocabularyId: listen.vocabularyId };
  if (listen.format === "listen-select") {
    const correct = listen.options.find((option) => option.id === listen.correctOptionId);
    const answers = [listen.correctOptionId, correct?.bg, correct?.de].filter(Boolean) as string[];
    return { ...common, options: { acceptedAnswers: answers, strict: true }, acceptedAnswers: answers };
  }
  if (listen.format === "listen-type") {
    const primary = listen.acceptedAnswers[0] ?? "";
    return {
      ...common,
      options: {
        ...authoredAnswerOptions(primary, listen.acceptedAnswers),
        allowOmittedSubjectPronoun: listen.allowOmittedSubjectPronoun,
      },
      acceptedAnswers: listen.acceptedAnswers,
    };
  }
  if (listen.format === "dictation") {
    const answers = [
      listen.audioText,
      ...(listen.acceptedVariants ?? []),
      ...(listen.acceptedTransliterations ?? []),
    ];
    return {
      ...common,
      options: {
        acceptedAnswers: [listen.audioText],
        acceptedVariants: listen.acceptedVariants,
        acceptedTransliterations: listen.acceptedTransliterations,
        allowOmittedSubjectPronoun: listen.allowOmittedSubjectPronoun,
      },
      acceptedAnswers: answers,
    };
  }
  if (listen.format === "listen-reorder") {
    const answer = listen.correctOrder.join(" ");
    return { ...common, options: { acceptedAnswers: [answer], strict: true }, acceptedAnswers: [answer] };
  }
  const answer = listen.options[listen.correctOptionIndex];
  return { ...common, options: { acceptedAnswers: [answer], strict: true }, acceptedAnswers: [answer] };
}

function typeAllowed(exercise: Exercise, submittedType: ExerciseResult["exerciseType"]): boolean {
  if (submittedType === exercise.type) return true;
  if ((exercise.type === "quiz" || exercise.type === "matching") && submittedType === "fill-in") {
    return true;
  }
  return (
    (exercise.type === "fill-in" || exercise.type === "sentence-builder" || exercise.type === "listen")
    && submittedType === "quiz"
  );
}

function isProductive(
  exerciseType: ExerciseResult["exerciseType"],
  item: ExerciseDataItem
): boolean {
  if (exerciseType === "fill-in" || exerciseType === "sentence-builder" || exerciseType === "typing") {
    return true;
  }
  if (exerciseType !== "listen") return false;
  const listen = item as ListenExerciseItem;
  return listen.format === "listen-type"
    || listen.format === "dictation"
    || listen.format === "listen-reorder";
}

function isRequired(item: ExerciseDataItem): boolean {
  return item.required ?? true;
}

export function validateLessonResults(
  lesson: Lesson,
  submittedResults: ExerciseResult[]
): ExerciseResult[] {
  const initialItems = new Set<string>();
  const verified = submittedResults.map((submitted, resultIndex) => {
    const exercise = lesson.exercises.find((candidate) => candidate.id === submitted.exerciseId);
    if (!exercise) {
      throw new LearningValidationError(
        "UNKNOWN_EXERCISE",
        `Unknown exercise '${submitted.exerciseId}'`,
        `results[${resultIndex}]`
      );
    }
    if (!typeAllowed(exercise, submitted.exerciseType)) {
      throw new LearningValidationError(
        "INVALID_EXERCISE_TYPE",
        `Exercise '${exercise.id}' cannot be submitted as '${submitted.exerciseType}'`,
        `results[${resultIndex}].exerciseType`
      );
    }
    if (Date.parse(submitted.completedAt) < Date.parse(submitted.startedAt)) {
      throw new LearningValidationError(
        "INVALID_ATTEMPT_TIMELINE",
        `Exercise '${exercise.id}' completes before it starts`,
        `results[${resultIndex}]`
      );
    }

    const itemResults = submitted.itemResults.map((answer) => {
      const expected = expectedAnswer(exercise, answer.itemId);
      const evaluation = evaluateAnswerDetailed(answer.userAnswer ?? "", {
        ...expected.options,
        // Alternative fill-in retries remain typo-tolerant even when the source was selection-based.
        strict: submitted.exerciseType === "fill-in" ? false : expected.options.strict,
      });
      const feedback = buildEvaluationFeedback(
        evaluation,
        expected.acceptedAnswers,
        expected.explanation
      );
      if (answer.attemptNumber === 1) initialItems.add(`${exercise.id}:${answer.itemId}`);

      const verifiedAnswer = buildExerciseItemResult({
        itemId: answer.itemId,
        userAnswer: answer.userAnswer,
        acceptedAnswers: expected.acceptedAnswers,
        status: evaluation.status,
        feedback: [formatRichFeedback(feedback), expected.explanation].filter(Boolean).join(" "),
        feedbackStatus: evaluation.richStatus,
        feedbackNeedsReview: false,
        durationMs: answer.durationMs,
        startedAt: answer.startedAt,
        completedAt: answer.completedAt,
        attemptNumber: answer.attemptNumber,
        hintsUsed: answer.hintsUsed,
        required: isRequired(expected.item),
        productive: isProductive(submitted.exerciseType, expected.item),
        vocabularyId: expected.vocabularyId,
      });
      return { ...verifiedAnswer, id: answer.id };
    });

    return buildExerciseResult({
      exerciseId: exercise.id,
      exerciseType: submitted.exerciseType,
      itemResults,
      startedAt: submitted.startedAt,
      completedAt: submitted.completedAt,
    });
  });

  const missing = lesson.exercises.flatMap((exercise) =>
    exerciseItems(exercise)
      .filter(isRequired)
      .map((item) => `${exercise.id}:${itemId(item)}`)
      .filter((key) => !initialItems.has(key))
  );
  if (missing.length > 0) {
    throw new LearningValidationError(
      "MISSING_REQUIRED_ITEM",
      `Missing ${missing.length} required first-attempt item(s)`,
      missing.join(",")
    );
  }
  return verified;
}
