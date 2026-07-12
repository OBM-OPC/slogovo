export interface SpeakingAttempt {
  id: string;
  userId?: string;
  phraseId: string;
  targetPhrase: string;
  transcript: string;
  normalizedTranscript: string;
  confidence?: number;
  pronunciationScore?: number;
  matched: boolean;
  feedback: string;
  audioReference?: string;
  createdAt: string;
}

export interface SpeakingAttemptInput {
  phraseId: string;
  targetPhrase: string;
  transcript: string;
  audioReference?: string;
}
