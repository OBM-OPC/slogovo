import { describe, expect, it } from "vitest";
import {
  evaluateAudioComprehension,
  evaluateDictation,
  evaluateListenReorder,
  evaluateListenSelect,
  evaluateListenType,
} from "./listen-exercise";

const options = [
  { id: "a", de: "Hallo", bg: "здравей" },
  { id: "b", de: "Tschüss", bg: "довиждане" },
];

describe("listen exercise evaluation", () => {
  it("scores all supported formats", () => {
    expect(evaluateListenSelect({ format: "listen-select", id: "q1", audioText: "здравей", options, correctOptionId: "a" }, "a").correct).toBe(true);
    expect(evaluateListenType({ format: "listen-type", id: "q2", audioText: "здравей", acceptedAnswers: ["здравей"] }, "здравей").correct).toBe(true);
    expect(evaluateDictation({ format: "dictation", id: "q3", audioText: "Аз съм тук" }, "Аз съм тук").correct).toBe(true);
    expect(evaluateListenReorder({ format: "listen-reorder", id: "q4", audioText: "Аз съм тук", correctOrder: ["Аз", "съм", "тук"] }, ["Аз", "съм", "тук"]).correct).toBe(true);
    expect(evaluateAudioComprehension({ format: "audio-comprehension", id: "q5", audioText: "Как си?", question: "Meaning?", options: ["How are you?", "Hello"], correctOptionIndex: 0 }, 0).correct).toBe(true);
  });
});
