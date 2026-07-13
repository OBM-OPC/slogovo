import { describe, expect, it } from "vitest";
import { evaluateSpeakingAttempt } from "./speaking";

describe("evaluateSpeakingAttempt", () => {
  it("matches identical and explicitly accepted transcripts", () => {
    expect(evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "добър ден",
      transcript: "добър ден",
    })).toMatchObject({ matched: true, transcriptMatch: "exact" });

    expect(evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "добър ден",
      acceptedTranscripts: ["добър ден ви желая"],
      transcript: "добър ден ви желая",
    })).toMatchObject({ matched: true, transcriptMatch: "exact" });
  });

  it("models partial phrase matching for future feedback", () => {
    const attempt = evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "аз съм тук",
      transcript: "аз съм",
      confidence: 0.82,
    });
    expect(attempt).toMatchObject({
      matched: false,
      transcriptMatch: "partial",
      confidence: 0.82,
    });
  });

  it("does not overclaim pronunciation scoring", () => {
    const attempt = evaluateSpeakingAttempt({
      phraseId: "p1",
      targetPhrase: "здравей",
      transcript: "здравей",
    });
    expect(attempt.pronunciationAssessment).toBe("not-evaluated");
    expect(attempt.feedback).toContain("Aussprache selbst wurde nicht bewertet");
    expect(attempt).not.toHaveProperty("pronunciationScore");
  });

  it("handles missing and different transcripts without treating them as matches", () => {
    expect(evaluateSpeakingAttempt({ phraseId: "p1", targetPhrase: "здравей", transcript: "" }))
      .toMatchObject({ matched: false, transcriptMatch: "unavailable" });
    expect(evaluateSpeakingAttempt({ phraseId: "p1", targetPhrase: "здравей", transcript: "довиждане" }))
      .toMatchObject({ matched: false, transcriptMatch: "none" });
  });
});
