import { describe, expect, it } from "vitest";
import type { ExerciseResult, Lesson } from "@/types";
import { buildExerciseItemResult, buildExerciseResult } from "./evaluation";
import { LearningValidationError } from "./learning-errors";
import { validateLessonResults } from "./server-attempt-validation";

const lesson: Lesson = {
  lessonId: "lesson-1",
  moduleId: "module-1",
  level: "A1",
  title: "Server validation",
  duration: "5 min",
  introduction: "Intro",
  summary: "Summary",
  vocabulary: [],
  grammar: { title: "Grammar", explanation: "Explanation", examples: [] },
  exercises: [{
    id: "fill-1",
    type: "fill-in",
    title: "Fill",
    data: [{
      id: "item-1",
      parts: ["", "____"],
      answer: "здравей",
      answers: ["здравей", "zdravey"],
      bg: "Здравей!",
    }],
  }],
};

function submitted(userAnswer: string, status: "correct" | "wrong" = "correct"): ExerciseResult {
  const answer = buildExerciseItemResult({
    itemId: "item-1",
    userAnswer,
    acceptedAnswers: ["forged"],
    status,
    durationMs: 1_500,
    startedAt: "2026-07-13T10:00:00.000Z",
    completedAt: "2026-07-13T10:00:01.500Z",
    attemptNumber: 1,
    required: false,
    productive: false,
  });
  return buildExerciseResult({
    exerciseId: "fill-1",
    exerciseType: "fill-in",
    itemResults: [answer],
    startedAt: "2026-07-13T10:00:00.000Z",
    completedAt: "2026-07-13T10:00:02.000Z",
  });
}

describe("server attempt validation", () => {
  it("recalculates status, accepted answers, required/productive flags, and feedback", () => {
    const source = submitted("not the answer", "correct");
    const originalId = source.itemResults[0].id;
    const [verified] = validateLessonResults(lesson, [source]);

    expect(verified.itemResults[0]).toMatchObject({
      id: originalId,
      status: "wrong",
      isPassing: false,
      acceptedAnswers: ["здравей", "zdravey"],
      feedbackStatus: "incorrect",
      required: true,
      productive: true,
    });
  });

  it("accepts only explicitly authored transliteration", () => {
    expect(validateLessonResults(lesson, [submitted("zdravey")])[0].itemResults[0])
      .toMatchObject({ status: "correct", feedbackStatus: "accepted_variant" });
    expect(validateLessonResults(lesson, [submitted("hello")])[0].itemResults[0].isPassing)
      .toBe(false);
  });

  it("rejects attempts that omit required first-attempt items", () => {
    expect(() => validateLessonResults(lesson, [])).toThrowError(LearningValidationError);
    try {
      validateLessonResults(lesson, []);
    } catch (error) {
      expect(error).toMatchObject({ code: "MISSING_REQUIRED_ITEM" });
    }
  });

  it("rejects unknown items and invalid retry exercise types", () => {
    const unknown = submitted("здравей");
    unknown.itemResults[0].itemId = "unknown";
    expect(() => validateLessonResults(lesson, [unknown])).toThrow(/Unknown item/);

    const invalidType = submitted("здравей");
    invalidType.exerciseType = "matching";
    expect(() => validateLessonResults(lesson, [invalidType])).toThrow(/cannot be submitted/);
  });
});
