import { describe, expect, it } from "vitest";
import { evaluateGrammarAwareAnswer } from "./grammar-aware-evaluation";

describe("evaluateGrammarAwareAnswer", () => {
  it("accepts exact answer", () => {
    expect(
      evaluateGrammarAwareAnswer("аз съм от германия", {
        acceptedAnswers: ["аз съм от германия"],
      })
    ).toBe("correct");
  });

  it("rejects missing 'съм' when expected", () => {
    expect(
      evaluateGrammarAwareAnswer("аз от германия", {
        acceptedAnswers: ["аз съм от германия"],
        requiresSum: true,
      })
    ).toBe("wrong-form");
  });

  it("flags wrong masculine definite article", () => {
    expect(
      evaluateGrammarAwareAnswer("учителят", {
        acceptedAnswers: ["учителят"],
        pos: "noun",
        expectedGender: "masculine",
      })
    ).toBe("correct");
    expect(
      evaluateGrammarAwareAnswer("учител", {
        acceptedAnswers: ["учителят"],
        pos: "noun",
        expectedGender: "masculine",
      })
    ).toBe("wrong-form");
  });

  it("flags wrong feminine definite article", () => {
    expect(
      evaluateGrammarAwareAnswer("жената", {
        acceptedAnswers: ["жената"],
        pos: "noun",
        expectedGender: "feminine",
      })
    ).toBe("correct");
    expect(
      evaluateGrammarAwareAnswer("жена", {
        acceptedAnswers: ["жената"],
        pos: "noun",
        expectedGender: "feminine",
      })
    ).toBe("wrong-form");
  });

  it("accepts typo when grammar is correct", () => {
    expect(
      evaluateGrammarAwareAnswer("аз сам от германиа", {
        acceptedAnswers: ["аз съм от германия"],
      })
    ).toBe("typo");
  });

  it("rejects wrong verb ending when expected form given", () => {
    expect(
      evaluateGrammarAwareAnswer("чета", {
        acceptedAnswers: ["четеш"],
        pos: "verb",
        expectedVerbForm: "четеш",
      })
    ).toBe("wrong-form");
  });

  it("returns skipped for empty answer", () => {
    expect(
      evaluateGrammarAwareAnswer("   ", {
        acceptedAnswers: ["учителят"],
      })
    ).toBe("skipped");
  });
});
