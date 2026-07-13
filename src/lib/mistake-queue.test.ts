import { describe, expect, it } from "vitest";
import { Exercise } from "@/types";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { buildExerciseItemResult, buildExerciseResult } from "./evaluation";
import { createRetryRuns } from "./lesson-flow";
import { buildMistakeQueueFromResults } from "./mistake-queue";

describe("MistakeQueue", () => {
  it("collects only failed required items", () => {
    const result = makeExerciseResult(["wrong", "correct"]);
    const queue = buildMistakeQueueFromResults([result]);
    expect(queue.size()).toBe(1);
    expect(queue.peek()?.itemId).toBe("item-1");
  });

  it("turns a failed quiz item into a productive fill-in retry", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "quiz",
      title: "Test",
      data: [
        { id: "item-1", question: "Wie heißt Hallo?", options: ["right", "wrong"], correctOptionIndex: 0 },
        { id: "item-2", question: "Q2", options: ["right", "wrong"], correctOptionIndex: 0 },
      ],
    };

    const retries = createRetryRuns(exercise, makeExerciseResult(["wrong", "correct"]));

    expect(retries).toHaveLength(1);
    expect(retries[0]).toMatchObject({ attemptNumber: 2, retry: true });
    expect(retries[0].exercise).toMatchObject({ id: "exercise-1", type: "fill-in" });
    expect(retries[0].exercise.data).toEqual([
      expect.objectContaining({
        id: "item-1",
        answer: "right",
        answers: ["right"],
        de: "Wie heißt Hallo?",
      }),
    ]);
  });

  it("keeps a matching mistake queued after an immediate correction", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "matching",
      title: "Paare",
      data: [
        { id: "item-1", de: "Hallo", bg: "Здравей" },
        { id: "item-2", de: "Danke", bg: "Благодаря" },
      ],
    };
    const startedAt = "2026-07-13T10:00:00.000Z";
    const itemResults = [
      buildExerciseItemResult({
        itemId: "item-1",
        userAnswer: "Благодаря",
        acceptedAnswers: ["Здравей"],
        status: "wrong",
        durationMs: 500,
        startedAt,
        attemptNumber: 1,
      }),
      buildExerciseItemResult({
        itemId: "item-1",
        userAnswer: "Здравей",
        acceptedAnswers: ["Здравей"],
        status: "correct",
        durationMs: 500,
        startedAt,
        attemptNumber: 1,
      }),
    ];
    const result = buildExerciseResult({
      exerciseId: exercise.id,
      exerciseType: "matching",
      itemResults,
      startedAt,
    });

    const retries = createRetryRuns(exercise, result);

    expect(retries).toHaveLength(1);
    expect(retries[0].attemptNumber).toBe(2);
    expect(retries[0].exercise).toMatchObject({ id: "exercise-1", type: "fill-in" });
    expect(retries[0].exercise.data[0]).toMatchObject({ id: "item-1", de: "Hallo" });
  });

  it("scaffolds a failed productive retry as a quiz and stops after attempt three", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "fill-in",
      title: "Schreiben",
      data: [{
        id: "item-1",
        parts: ["", "____"],
        answer: "right",
        answers: ["right"],
        de: "Wähle die richtige Antwort",
      }],
    };
    const attemptTwo = makeExerciseResult(["wrong"], {
      exerciseType: "fill-in",
      productive: true,
      attemptNumber: 2,
    });

    const retries = createRetryRuns(exercise, attemptTwo);

    expect(retries).toHaveLength(1);
    expect(retries[0]).toMatchObject({ attemptNumber: 3, retry: true });
    expect(retries[0].exercise).toMatchObject({ id: "exercise-1", type: "quiz" });
    const retryQuestion = retries[0].exercise.data[0] as {
      id: string;
      options: string[];
      correctOptionIndex: number;
    };
    expect(retryQuestion.id).toBe("item-1");
    expect(retryQuestion.options[retryQuestion.correctOptionIndex]).toBe("right");

    const attemptThree = makeExerciseResult(["wrong"], {
      exerciseType: "quiz",
      attemptNumber: 3,
    });
    expect(createRetryRuns(retries[0].exercise, attemptThree)).toEqual([]);
  });

  it("does not queue another retry after the alternative exercise passes", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "quiz",
      title: "Test",
      data: [{ id: "item-1", question: "Q1", options: ["right", "wrong"], correctOptionIndex: 0 }],
    };
    const [retry] = createRetryRuns(exercise, makeExerciseResult(["wrong"]));
    const passed = makeExerciseResult(["correct"], {
      exerciseType: "fill-in",
      productive: true,
      attemptNumber: 2,
    });

    expect(createRetryRuns(retry.exercise, passed)).toEqual([]);
  });

  it.each([
    {
      exercise: {
        id: "exercise-1",
        type: "sentence-builder",
        title: "Satzbau",
        data: [{ id: "item-1", words: ["right"], correctOrder: ["right"], de: "Baue den Satz" }],
      } satisfies Exercise,
      exerciseType: "sentence-builder" as const,
    },
    {
      exercise: {
        id: "exercise-1",
        type: "listen",
        title: "Hören",
        data: [{ id: "item-1", format: "dictation", audioText: "right" }],
      } satisfies Exercise,
      exerciseType: "listen" as const,
    },
  ])("turns a failed $exerciseType item into a renderable quiz", ({ exercise, exerciseType }) => {
    const result = makeExerciseResult(["wrong"], { exerciseType, attemptNumber: 1 });

    const retries = createRetryRuns(exercise, result);

    expect(retries).toHaveLength(1);
    expect(retries[0].exercise.type).toBe("quiz");
    expect(retries[0].exercise.data[0]).toMatchObject({ id: "item-1" });
  });

  it("does not queue optional mistakes", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "quiz",
      title: "Optional",
      data: [{ id: "item-1", question: "Q1", options: ["right", "wrong"], correctOptionIndex: 0, required: false }],
    };
    const result = makeExerciseResult(["wrong"], { required: false });

    expect(createRetryRuns(exercise, result)).toEqual([]);
  });
});
