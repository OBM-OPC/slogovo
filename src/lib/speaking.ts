import { SpeakingAttempt, SpeakingAttemptInput } from "@/types/speaking";
import { normalizeAnswer } from "./answer-evaluation";

export function evaluateSpeakingAttempt(input: SpeakingAttemptInput): SpeakingAttempt {
  const normalizedTarget = normalizeAnswer(input.targetPhrase, {});
  const normalizedTranscript = normalizeAnswer(input.transcript, {});
  const matched = normalizedTranscript === normalizedTarget || normalizedTarget.includes(normalizedTranscript);

  let feedback: string;
  if (matched) {
    feedback = "Gut! Deine Aussprache wurde als passend erkannt.";
  } else {
    feedback = `Wiederhole den Satz: '${input.targetPhrase}'. Achte auf die bulgarischen Laute.`;
  }

  return {
    id: crypto.randomUUID(),
    phraseId: input.phraseId,
    targetPhrase: input.targetPhrase,
    transcript: input.transcript,
    normalizedTranscript,
    matched,
    feedback,
    audioReference: input.audioReference,
    createdAt: new Date().toISOString(),
  };
}
