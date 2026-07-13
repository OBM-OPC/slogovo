import { SpeakingAttempt, SpeakingAttemptInput, TranscriptMatch } from "@/types/speaking";
import { normalizeAnswer } from "./answer-evaluation";

function tokenOverlap(target: string, transcript: string): number {
  const targetTokens = new Set(target.split(/\s+/).filter(Boolean));
  const transcriptTokens = new Set(transcript.split(/\s+/).filter(Boolean));
  if (targetTokens.size === 0 || transcriptTokens.size === 0) return 0;
  const shared = [...transcriptTokens].filter((token) => targetTokens.has(token)).length;
  return shared / Math.max(targetTokens.size, transcriptTokens.size);
}

export function evaluateSpeakingAttempt(input: SpeakingAttemptInput): SpeakingAttempt {
  const normalizedTarget = normalizeAnswer(input.targetPhrase, {});
  const normalizedTranscript = normalizeAnswer(input.transcript, {});
  const accepted = [input.targetPhrase, ...(input.acceptedTranscripts ?? [])]
    .map((phrase) => normalizeAnswer(phrase, {}));

  let transcriptMatch: TranscriptMatch;
  if (!normalizedTranscript) {
    transcriptMatch = "unavailable";
  } else if (accepted.includes(normalizedTranscript)) {
    transcriptMatch = "exact";
  } else if (tokenOverlap(normalizedTarget, normalizedTranscript) >= 0.5) {
    transcriptMatch = "partial";
  } else {
    transcriptMatch = "none";
  }

  let feedback: string;
  if (transcriptMatch === "exact") {
    feedback = "Das erkannte Transkript passt zum Zielsatz. Die Aussprache selbst wurde nicht bewertet.";
  } else if (transcriptMatch === "partial") {
    feedback = `Das erkannte Transkript passt teilweise. Wiederhole: „${input.targetPhrase}“. Eine Aussprachebewertung erfolgt noch nicht.`;
  } else if (transcriptMatch === "unavailable") {
    feedback = "Es liegt noch kein Transkript vor. Die Aussprache wurde nicht bewertet.";
  } else {
    feedback = `Das erkannte Transkript weicht ab. Wiederhole: „${input.targetPhrase}“. Die Aussprache selbst wurde nicht bewertet.`;
  }

  return {
    id: crypto.randomUUID(),
    phraseId: input.phraseId,
    targetPhrase: input.targetPhrase,
    transcript: input.transcript,
    normalizedTranscript,
    confidence: input.confidence,
    transcriptMatch,
    pronunciationAssessment: "not-evaluated",
    matched: transcriptMatch === "exact",
    feedback,
    audioReference: input.audioReference,
    createdAt: new Date().toISOString(),
  };
}
