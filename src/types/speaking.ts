export type TranscriptMatch = "exact" | "partial" | "none" | "unavailable";

export interface SpeakingAttempt {
  id: string;
  userId?: string;
  phraseId: string;
  targetPhrase: string;
  transcript: string;
  normalizedTranscript: string;
  confidence?: number;
  transcriptMatch: TranscriptMatch;
  /** Explicitly records that transcript matching is not pronunciation scoring. */
  pronunciationAssessment: "not-evaluated";
  matched: boolean;
  feedback: string;
  audioReference?: string;
  createdAt: string;
}

export interface SpeakingAttemptInput {
  phraseId: string;
  targetPhrase: string;
  transcript: string;
  acceptedTranscripts?: string[];
  confidence?: number;
  audioReference?: string;
}
