import { VocabularyItem } from "@/types";
import { VocabularyProgress } from "@/types";
import { isDueForReview } from "./spaced-repetition";
import { getDailyGoalNumbers } from "./progress-db";

export type ExerciseMode = "recognition" | "production";

export interface PlannerItem {
  wordId: string;
  word: VocabularyItem;
  mode: ExerciseMode;
  source: "due_review" | "weak" | "new" | "mistake" | "listening";
  estimatedMinutes: number;
}

export interface DailyPlan {
  reviewItems: PlannerItem[];
  weakItems: PlannerItem[];
  newItems: PlannerItem[];
  listeningItems: PlannerItem[];
  productiveItems: PlannerItem[];
  estimatedMinutes: number;
}

export interface PlannerOptions {
  dailyGoal?: "light" | "medium" | "intense";
  availableMinutes?: number;
  maxNewItems?: number;
  maxReviewBacklog?: number;
  includeListening?: boolean;
}

const DEFAULT_OPTIONS: Required<PlannerOptions> = {
  dailyGoal: "medium",
  availableMinutes: 15,
  maxNewItems: 10,
  maxReviewBacklog: 50,
  includeListening: true,
};

function modeForWord(word: VocabularyItem, progress?: VocabularyProgress): ExerciseMode {
  // If a word has been reviewed productively before, keep pushing production.
  // Otherwise start with recognition.
  if (!progress || progress.timesCorrect === 0) return "recognition";
  const total = progress.timesCorrect + progress.timesWrong;
  const productiveRatio = progress.timesCorrect / Math.max(1, total);
  return productiveRatio >= 0.7 ? "production" : "recognition";
}

export function buildDailyPlan(
  allWords: VocabularyItem[],
  vocabularyProgress: Record<string, VocabularyProgress>,
  recentMistakeIds: string[] = [],
  options: PlannerOptions = {}
): DailyPlan {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const goal = getDailyGoalNumbers(opts.dailyGoal);
  const targetMinutes = opts.availableMinutes ?? goal.minutes;
  const targetItems = Math.max(5, Math.round(targetMinutes * 2)); // ~2 items per minute

  // 1. Due reviews (scheduled spaced repetition)
  const dueReviewIds = allWords
    .filter((w) => {
      const p = vocabularyProgress[w.id];
      return p && isDueForReview(p);
    })
    .map((w) => w.id)
    .slice(0, opts.maxReviewBacklog);

  // 2. Recent mistakes (short-term reinforcement)
  const mistakeIds = recentMistakeIds
    .filter((id) => !dueReviewIds.includes(id))
    .slice(0, 10);

  // 3. New items (not yet studied)
  const newIds = allWords
    .filter((w) => {
      const p = vocabularyProgress[w.id];
      return !p || (p.timesCorrect === 0 && p.timesWrong === 0);
    })
    .map((w) => w.id)
    .slice(0, opts.maxNewItems);

  // 4. Weak items (low accuracy, not due)
  const weakIds = allWords
    .filter((w) => {
      const p = vocabularyProgress[w.id];
      if (!p) return false;
      const total = p.timesCorrect + p.timesWrong;
      return total > 0 && p.timesCorrect / total < 0.7 && !dueReviewIds.includes(w.id);
    })
    .map((w) => w.id)
    .slice(0, 10);

  // Cap new items if review backlog is high.
  const effectiveNewCount = dueReviewIds.length > 10 ? Math.min(newIds.length, 3) : newIds.length;

  const reviewItems = dueReviewIds.map((id) => ({
    wordId: id,
    word: allWords.find((w) => w.id === id)!,
    mode: modeForWord(allWords.find((w) => w.id === id)!, vocabularyProgress[id]),
    source: "due_review" as const,
    estimatedMinutes: 0.5,
  }));

  const mistakeItems = mistakeIds.map((id) => ({
    wordId: id,
    word: allWords.find((w) => w.id === id)!,
    mode: "recognition" as const,
    source: "mistake" as const,
    estimatedMinutes: 0.5,
  }));

  const newItems = newIds.slice(0, effectiveNewCount).map((id) => ({
    wordId: id,
    word: allWords.find((w) => w.id === id)!,
    mode: "recognition" as const,
    source: "new" as const,
    estimatedMinutes: 0.5,
  }));

  const weakItems = weakIds.map((id) => ({
    wordId: id,
    word: allWords.find((w) => w.id === id)!,
    mode: modeForWord(allWords.find((w) => w.id === id)!, vocabularyProgress[id]),
    source: "weak" as const,
    estimatedMinutes: 0.5,
  }));

  // Listening items: pick from due/new/weak words for audio-only practice.
  const listeningSourceIds = [...dueReviewIds, ...weakIds, ...newIds.slice(0, effectiveNewCount)];
  const listeningItems = opts.includeListening
    ? listeningSourceIds
        .slice(0, 5)
        .map((id) => ({
          wordId: id,
          word: allWords.find((w) => w.id === id)!,
          mode: "recognition" as const,
          source: "listening" as const,
          estimatedMinutes: 0.5,
        }))
    : [];

  // Productive recall items: due/weak words that are ready for production.
  const productiveItems = [...reviewItems, ...weakItems]
    .filter((item) => item.mode === "production")
    .slice(0, Math.max(3, Math.round(targetItems * 0.3)));

  const allItems = [...reviewItems, ...mistakeItems, ...newItems, ...weakItems, ...listeningItems];
  const estimatedMinutes = Math.min(targetMinutes, allItems.length * 0.5);

  return {
    reviewItems,
    weakItems: [...mistakeItems, ...weakItems],
    newItems,
    listeningItems,
    productiveItems,
    estimatedMinutes,
  };
}
