import { describe, expect, it } from "vitest";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { evaluateMasteryPass } from "./mastery";

describe("evaluateMasteryPass", () => {
  it("rejects an all-wrong result", () => {
    expect(evaluateMasteryPass([makeExerciseResult(["wrong", "wrong"])]).passed).toBe(false);
  });

  it("requires mastery accuracy rather than ordinary screen completion", () => {
    expect(evaluateMasteryPass([makeExerciseResult(["correct", "correct", "correct", "wrong"])]).passed).toBe(false);
  });

  it("accepts a fully correct result", () => {
    expect(evaluateMasteryPass([makeExerciseResult(["correct", "correct"])]).passed).toBe(true);
  });
});
