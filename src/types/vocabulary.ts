import { Level } from "./index";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "numeral"
  | "particle";

export type GrammaticalGender = "masculine" | "feminine" | "neuter" | "plural";

export type VerbAspect = "imperfective" | "perfective";

export interface ExampleSentence {
  bg: string;
  de: string;
  bgLatin?: string;
}

export interface VerbConjugation {
  firstSingular: string;
  secondSingular: string;
  thirdSingular: string;
  firstPlural: string;
  secondPlural: string;
  thirdPlural: string;
}

export interface VocabularyItem {
  id: string;

  /** Bulgarian form shown to the learner (can be lemma or phrase). */
  bg: string;

  /** Lemma / dictionary form. Defaults to `bg` if not provided. */
  lemma?: string;

  /** One or more German meanings/translations. */
  de: string;

  /** Additional accepted German meanings. */
  deMeanings?: string[];

  /** Latin-script approximation for learners who cannot read Cyrillic yet. */
  bgLatin?: string;

  /** Short pronunciation hint in German, e.g. 'Betonung auf der ersten Silbe'. */
  pronunciationHint?: string;

  /** 1-based index of the stressed syllable, if known. */
  stressPosition?: number;

  /** Part of speech. */
  pos?: PartOfSpeech;

  /** CEFR level of the item, if different from the lesson level. */
  cefr?: Level;

  /** Free-form tags for filtering and analytics. */
  tags?: string[];

  /** Audio file path/URL. */
  audio?: string;

  /** Whether the audio was generated and verified. */
  audioGenerated?: boolean;

  /** For nouns. */
  gender?: GrammaticalGender;
  plural?: string;
  pluralLatin?: string;
  /** Definite article forms: nominative definite, etc. */
  definite?: {
    nominative?: string;
    accusative?: string;
    dative?: string;
  };

  /** For verbs. */
  verbAspect?: VerbAspect;
  aspectPartner?: string; // lemma of the opposite aspect partner
  conjugation?: VerbConjugation;

  /** For adjectives / pronouns. */
  comparative?: string;
  superlative?: string;

  /** Accepted Bulgarian answers for typing exercises (case/gender variants). */
  acceptedAnswers?: string[];

  /** Example sentences using the word/phrase. */
  examples?: ExampleSentence[];

  /** If true, the entry requires review by a native speaker before it is considered verified. */
  needsNativeReview?: boolean;

  /** Optional content category id for grouping. */
  category?: string;
}
