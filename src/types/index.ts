export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
export type DifficultyRating = "repeat" | "hard" | "good" | "easy";

export type {
  VocabularyItem,
  PartOfSpeech,
  GrammaticalGender,
  VerbAspect,
} from "./vocabulary";
import type { VocabularyItem } from "./vocabulary";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _vocabularyTypeRef: VocabularyItem | undefined = undefined;
void _vocabularyTypeRef;

export interface GrammarExample {
  bg: string;
  de: string;
  bgLatin?: string;
}

export interface GrammarTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface GrammarSection {
  title: string;
  explanation: string;
  examples: GrammarExample[];
  tables?: GrammarTable[];
  exercises?: Exercise[];
}

export type ExerciseType = "quiz" | "fill-in" | "matching" | "sentence-builder" | "listen";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  bg?: string;
  explanation?: string;
  grammarTopicSlug?: string;
}

export interface FillInSentence {
  id: string;
  parts: string[]; // ["Аз ", "____", " от Германия."]
  answer: string;
  answers: string[]; // accepted alternatives
  bg?: string;
  de?: string; // German hint for the full sentence meaning
  explanation?: string;
  grammarTopicSlug?: string;
}

export interface MatchingPair {
  id: string;
  de: string;
  bg: string;
  explanation?: string;
  grammarTopicSlug?: string;
}

export interface SentenceBuilder {
  id: string;
  words: string[];
  correctOrder: string[];
  bg?: string;
  de?: string;
  explanation?: string;
  grammarTopicSlug?: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  data: QuizQuestion[] | FillInSentence[] | MatchingPair[] | SentenceBuilder[];
}

export interface Lesson {
  lessonId: string;
  moduleId: string;
  level: Level;
  title: string;
  duration: string;
  introduction: string;
  summary: string;
  vocabulary: VocabularyItem[];
  grammar: GrammarSection;
  exercises: Exercise[];
}

export interface ModuleMeta {
  moduleId: string;
  level: Level;
  title: string;
  description: string;
  order: number;
  icon?: string;
  requiredScore?: number;
  lessons: {
    lessonId: string;
    title: string;
    duration: string;
  }[];
}

export interface VocabularyProgress {
  status: "new" | "learning" | "review" | "mastered" | "difficult";
  nextReview?: string; // ISO date
  timesCorrect: number;
  timesWrong: number;
  lastReviewed?: string;
  intervalIndex: number; // 0,1,2,3,4 → 1,3,7,14,30 days
  easeFactor?: number; // Anki-style ease factor
}

export type DailyGoal = "light" | "medium" | "intense";

export interface UserSettings {
  dailyGoal: DailyGoal;
  ttsEnabled: boolean;
  showLatin: boolean;
  speechRate: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastStudyDate?: string;
}

export interface UserProgress {
  userId: string;
  streak: Streak;
  completedLessons: string[];
  masteredLessons: string[];
  completedModules: string[];
  vocabularyProgress: Record<string, VocabularyProgress>;
  lessonScores: Record<string, number>;
  exerciseStats: {
    total: number;
    correct: number;
    wrong: number;
    consecutiveCorrect?: number;
  };
  dailyStats: Record<string, { minutes: number; vocabulary: number }>;
  settings: UserSettings;
  achievements: string[];
}

export interface GrammarTopic {
  topicId: string;
  level: Level;
  title: string;
  slug: string;
  shortDescription: string;
  content: GrammarSection[];
}

export interface AlphabetLetter {
  upper: string;
  lower: string;
  nameBg: string;
  pronunciation: string;
  example: string;
  exampleLatin?: string;
  exampleTranslation: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export type AchievementCondition = (progress: UserProgress) => boolean;

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30];
