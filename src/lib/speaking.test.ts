import { describe, expect, it } from "vitest";
import { evaluateSpeakingAttempt } from "./speaking";

describe("evaluateSpeakingAttempt", () => {
  it("matches identical transcript", () => {
    const attempt = evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "здравей",
      transcript: "здравей",
    });
    expect(attempt.matched).toBe(true);
  });

  it("does not overclaim pronunciation scoring", () => {
    const attempt = evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "здравей",
      transcript: "здравей",
    });
    expect(attempt.pronunciationScore).toBeUndefined();
    expect(attempt.feedback).not.toContain("Punktzahl");
  });

  it("suggests retry when transcript differs", () => {
    const attempt = evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "здравей",
      transcript: "zdravei",
    });
    expect(attempt.matched).toBe(false);
    expect(attempt.feedback).toContain("Wiederhole");
  });
});
