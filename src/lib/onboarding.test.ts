import { describe, expect, it } from "vitest";
import { recommendLearningPath, recommendedWeeklyLearningDays } from "./onboarding";

describe("onboarding recommendation", () => {
  it("routes new readers through Cyrillic and experienced learners to review", () => {
    expect(recommendLearningPath({ knowsCyrillic: false, priorBulgarian: "intermediate", knowsSlavicLanguage: true, learningGoal: "work" })).toBe("alphabet");
    expect(recommendLearningPath({ knowsCyrillic: true, priorBulgarian: "intermediate", knowsSlavicLanguage: false, learningGoal: "travel" })).toBe("a1-review");
    expect(recommendLearningPath({ knowsCyrillic: true, priorBulgarian: "none", knowsSlavicLanguage: false, learningGoal: "family" })).toBe("a1-foundation");
  });

  it("turns the daily commitment into a realistic weekly recommendation", () => {
    expect(recommendedWeeklyLearningDays("light")).toBe(5);
    expect(recommendedWeeklyLearningDays("medium")).toBe(4);
    expect(recommendedWeeklyLearningDays("intense")).toBe(3);
  });
});
