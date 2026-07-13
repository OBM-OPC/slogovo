import { describe, expect, it } from "vitest";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { createRetryRuns } from "./lesson-flow";
import { buildMistakeQueueFromResults } from "./mistake-queue";
import { Exercise } from "@/types";

describe("MistakeQueue", () => {
  it("collects only failed required items", () => {
    const result = makeExerciseResult(["wrong", "correct"]);
    const queue = buildMistakeQueueFromResults([result]);
    expect(queue.size()).toBe(1);
    expect(queue.peek()?.itemId).toBe("item-1");
  });

  it("failed required items return as deferred retry runs", () => {
    const exercise: Exercise = {
      id: "exercise-1",
      type: "quiz",
      title: "Test",
      data: [
        { id: "item-1", question: "Q1", options: ["right", "wrong"], correctOptionIndex: 0 },
        { id: "item-2", question: "Q2", options: ["right", "wrong"], correctOptionIndex: 0 },
      ],
    };
    const retries = createRetryRuns(exercise, makeExerciseResult(["wrong", "correct"]));
    expect(retries).toHaveLength(1);
    expect(retries[0].retry).toBe(true);
    expect(retries[0].attemptNumber).toBe(2);
    expect(retries[0].exercise.data).toHaveLength(1);
    expect((retries[0].exercise.data[0] as { id: string }).id).toBe("item-1");
  });
});
