import { describe, expect, it } from "vitest";
import { buildRichFeedback, statusToRich } from "./feedback";

describe("statusToRich", () => {
  it("maps evaluation statuses to rich statuses", () => {
    expect(statusToRich("correct")).toBe("correct");
    expect(statusToRich("typo")).toBe("correct_with_typo");
    expect(statusToRich("wrong-form")).toBe("wrong_form");
    expect(statusToRich("wrong")).toBe("incorrect");
    expect(statusToRich("skipped")).toBe("missing_word");
  });
});

describe("buildRichFeedback", () => {
  it("returns correct feedback", () => {
    const fb = buildRichFeedback("correct", "здравей", ["здравей"], "здравей", "здравей");
    expect(fb.status).toBe("correct");
    expect(fb.message).toBe("Richtig!");
    expect(fb.needsNativeReview).toBe(false);
  });

  it("returns typo feedback", () => {
    const fb = buildRichFeedback("typo", "здрвей", ["здравей"], "здрвей", "здравей");
    expect(fb.status).toBe("correct_with_typo");
    expect(fb.message).toContain("Schreibung");
  });

  it("returns wrong-form feedback with optional explanation", () => {
    const fb = buildRichFeedback("wrong-form", "здравеят", ["здравей"], "здравеят", "здравей", "Use the nominative form here.");
    expect(fb.status).toBe("wrong_form");
    expect(fb.explanation).toBe("Use the nominative form here.");
  });
});
