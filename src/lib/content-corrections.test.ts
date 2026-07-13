import { describe, expect, it } from "vitest";

import { BEGINNER_LABEL_BG } from "./content-copy";
import { getGrammarTopicBySlug, getLessonById } from "./content";

describe("known Phase 1 content corrections", () => {
  it("uses the Bulgarian beginner label instead of the Russian form", () => {
    expect(BEGINNER_LABEL_BG).toBe("Български за начинаещи");
    expect(BEGINNER_LABEL_BG).not.toContain("начинающих");
  });

  it("teaches that the subject pronoun, not present-tense съм, may be omitted", () => {
    const lesson = getLessonById("a1-modul-1-lektion-2");
    const topic = getGrammarTopicBySlug("verb-sein");
    const lessonExplanation = lesson?.grammar.explanation ?? "";
    const topicText = topic?.content
      .flatMap((section) => [section.title, section.explanation, ...section.examples.map((example) => example.bg)])
      .join(" ") ?? "";

    expect(lessonExplanation).toContain("Subjektpronomen kann entfallen");
    expect(lessonExplanation).not.toContain("fast immer weggelassen");
    expect(topicText).toContain("Subjektpronomen");
    expect(topicText).not.toContain("Аз от Германия");
    expect(topicText).not.toContain("Ние добре");
  });
});
