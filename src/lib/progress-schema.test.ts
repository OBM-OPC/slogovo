import { describe, expect, it } from "vitest";
import { defaultProgress } from "./progress-serialization";
import { parseUserProgress } from "./progress-schema";

describe("user progress schema", () => {
  it("accepts the canonical aggregate model", () => {
    expect(parseUserProgress(defaultProgress("u1"))).toEqual(defaultProgress("u1"));
  });

  it("rejects forged scores and malformed nested settings", () => {
    expect(() => parseUserProgress({
      ...defaultProgress("u1"),
      lessonScores: { lesson: 999 },
    })).toThrow();
    expect(() => parseUserProgress({
      ...defaultProgress("u1"),
      settings: { ...defaultProgress("u1").settings, speechRate: 99 },
    })).toThrow();
  });
});
