import { describe, expect, it } from "vitest";
import { buildExerciseResult } from "./evaluation";
import { buildMistakeQueueFromResults } from "./mistake-queue";

describe("MistakeQueue", () => {
  it("collects failing results with vocabulary id", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
        vocabularyId: "v1",
      }),
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q2",
        userAnswer: "right",
        acceptedAnswers: ["right"],
        durationMs: 100,
        vocabularyId: "v2",
      }),
    ];
    const queue = buildMistakeQueueFromResults(results);
    expect(queue.size()).toBe(1);
    expect(queue.peek()?.vocabularyId).toBe("v1");
  });

  it("re-inserts failed retry up to 2 times", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
        vocabularyId: "v1",
      }),
    ];
    const queue = buildMistakeQueueFromResults(results);
    const item = queue.next();
    expect(item).toBeDefined();
    queue.retry(item!, false);
    expect(queue.size()).toBe(1);
    const item2 = queue.next();
    queue.retry(item2!, false);
    expect(queue.size()).toBe(1);
    const item3 = queue.next();
    queue.retry(item3!, false);
    expect(queue.size()).toBe(0);
  });

  it("removes item on successful retry", () => {
    const results = [
      buildExerciseResult({
        exerciseId: "ex1",
        exerciseType: "quiz",
        itemId: "q1",
        userAnswer: "wrong",
        acceptedAnswers: ["right"],
        durationMs: 100,
        vocabularyId: "v1",
      }),
    ];
    const queue = buildMistakeQueueFromResults(results);
    const item = queue.next()!;
    queue.retry(item, true);
    expect(queue.size()).toBe(0);
  });
});
