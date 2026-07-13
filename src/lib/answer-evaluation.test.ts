import { describe, expect, it } from "vitest";
import { evaluateAnswer, normalizeAnswer } from "./answer-evaluation";

describe("normalizeAnswer", () => {
  it("removes punctuation and normalizes whitespace", () => {
    expect(normalizeAnswer("  Здравей,  свят!  ", {})).toBe("здравей свят");
  });

  it("removes German and Bulgarian quotes", () => {
    expect(normalizeAnswer('„Здравей"', {})).toBe("здравей");
    expect(normalizeAnswer("'Здравей'", {})).toBe("здравей");
  });

  it("removes diacritics", () => {
    expect(normalizeAnswer("Zdravéj", {})).toBe("zdravej");
  });
});

describe("evaluateAnswer", () => {
  it("returns correct for exact match", () => {
    expect(
      evaluateAnswer("здравей", { acceptedAnswers: ["здравей"] })
    ).toBe("correct");
  });

  it("returns correct for case/punctuation variant", () => {
    expect(
      evaluateAnswer("Здравей!", { acceptedAnswers: ["здравей"] })
    ).toBe("correct");
  });

  it("returns typo for one-letter misspelling of long word", () => {
    expect(
      evaluateAnswer("здрвей", { acceptedAnswers: ["здравей"] })
    ).toBe("typo");
  });

  it("returns wrong for nonsense", () => {
    expect(
      evaluateAnswer("xyz", { acceptedAnswers: ["здравей"] })
    ).toBe("wrong");
  });

  it("returns skipped for empty answer", () => {
    expect(evaluateAnswer("   ", { acceptedAnswers: ["здравей"] })).toBe("skipped");
  });

  it("returns wrong-form for plausible morphological variant", () => {
    expect(
      evaluateAnswer("здравеят", { acceptedAnswers: ["здравей"] })
    ).toBe("wrong-form");
  });

  it("supports multiple accepted answers", () => {
    expect(
      evaluateAnswer("hallo", { acceptedAnswers: ["hi", "hallo", "guten tag"] })
    ).toBe("correct");
  });

  it("strict mode rejects typo", () => {
    expect(
      evaluateAnswer("здрвей", { acceptedAnswers: ["здравей"], strict: true })
    ).toBe("wrong");
  });
});
