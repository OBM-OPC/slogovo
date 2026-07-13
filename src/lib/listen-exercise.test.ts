import { describe, expect, it } from "vitest";
import {
  evaluateListenSelect,
  evaluateListenType,
  evaluateDictation,
  evaluateListenReorder,
  evaluateAudioComprehension,
} from "./listen-exercise";

function vocab(id: string, de: string, bg: string) {
  return { id, de, bg };
}

describe("listen exercises", () => {
  it("listen-select accepts the correct option", () => {
    const item = {
      id: "q1",
      audioText: "здравей",
      options: [vocab("a", "Hallo", "здравей"), vocab("b", "Tschüss", "довиждане")],
      correctOptionId: "a",
    };
    const result = evaluateListenSelect(item, "a");
    expect(result.correct).toBe(true);
    expect(result.status).toBe("correct");
  });

  it("listen-type uses shared evaluator", () => {
    const item = {
      id: "q1",
      audioText: "здравей",
      acceptedAnswers: ["здравей"],
    };
    expect(evaluateListenType(item, "здравей").correct).toBe(true);
    expect(evaluateListenType(item, "здрвей").status).toBe("typo");
  });

  it("dictation compares full audio text", () => {
    const item = { id: "q1", audioText: "Аз съм от Германия.", wordCount: 4 };
    expect(evaluateDictation(item, "Аз съм от Германия").correct).toBe(true);
    expect(evaluateDictation(item, "Аз съм от Австрия").correct).toBe(false);
  });

  it("listen-reorder checks exact order", () => {
    const item = { id: "q1", audioText: "Аз съм учител", correctOrder: ["Аз", "съм", "учител"] };
    expect(evaluateListenReorder(item, ["Аз", "съм", "учител"]).correct).toBe(true);
    expect(evaluateListenReorder(item, ["съм", "Аз", "учител"]).correct).toBe(false);
  });

  it("audio-comprehension checks selected option", () => {
    const item = {
      id: "q1",
      audioText: "Как се казваш?",
      question: "Was bedeutet der Satz?",
      options: ["Wie heißt du?", "Wo wohnst du?"],
      correctOptionIndex: 0,
    };
    expect(evaluateAudioComprehension(item, 0).correct).toBe(true);
    expect(evaluateAudioComprehension(item, 1).correct).toBe(false);
  });
});
