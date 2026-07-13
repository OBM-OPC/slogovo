import type { VocabularyItem, VocabularyProgress } from "@/types";
import { getMasteryTracking } from "./mastery-tracking";
import { isDueForReview } from "./spaced-repetition";
import { getDailyGoalNumbers } from "./progress-db";

export type ExerciseMode = "recognition" | "production";
export type VocabularyPlanSource =
  | "due_review"
  | "weak"
  | "new"
  | "mistake"
  | "recent"
  | "listening"
  | "speaking";

export interface PlannerItem {
  kind: "vocabulary";
  wordId: string;
  word: VocabularyItem;
  mode: ExerciseMode;
  source: VocabularyPlanSource;
  estimatedMinutes: number;
}

export interface GrammarWeakness {
  id: string;
  title: string;
  href: string;
  score?: number;
}

export interface GrammarPlannerItem {
  kind: "grammar";
  grammarId: string;
  title: string;
  href: string;
  source: "grammar";
  estimatedMinutes: number;
}

export type DailySessionItem = PlannerItem | GrammarPlannerItem;

export interface DailyPlan {
  reviewItems: PlannerItem[];
  weakItems: PlannerItem[];
  recentItems: PlannerItem[];
  newItems: PlannerItem[];
  grammarItems: GrammarPlannerItem[];
  listeningItems: PlannerItem[];
  productiveItems: PlannerItem[];
  speakingItems: PlannerItem[];
  sessionItems: DailySessionItem[];
  reviewBacklog: number;
  estimatedMinutes: number;
}

export interface PlannerOptions {
  dailyGoal?: "light" | "medium" | "intense";
  availableMinutes?: number;
  maxNewItems?: number;
  maxReviewBacklog?: number;
  largeReviewBacklogThreshold?: number;
  includeListening?: boolean;
  includeSpeaking?: boolean;
  recentWordIds?: string[];
  grammarWeaknesses?: GrammarWeakness[];
}

const DEFAULT_OPTIONS = {
  dailyGoal: "medium" as const,
  maxNewItems: 10,
  maxReviewBacklog: 50,
  largeReviewBacklogThreshold: 10,
  includeListening: true,
  includeSpeaking: false,
  recentWordIds: [] as string[],
  grammarWeaknesses: [] as GrammarWeakness[],
};

function modeForWord(progress?: VocabularyProgress): ExerciseMode {
  if (!progress) return "recognition";
  const mastery = getMasteryTracking(progress);
  if (mastery.productionTotal > 0) return "production";
  if (mastery.recognitionTotal >= 3) {
    const recognitionAccuracy = mastery.recognitionCorrect / mastery.recognitionTotal;
    return recognitionAccuracy >= 0.7 ? "production" : "recognition";
  }

  const hasSeparateEvidence = mastery.recognitionTotal > 0
    || progress.recognitionCorrect !== undefined
    || progress.productionCorrect !== undefined
    || progress.productionTotal !== undefined;
  if (hasSeparateEvidence) return "recognition";

  // Migrate legacy progress naturally: established recognition success advances
  // to recall even before the separate counters existed.
  const legacyTotal = progress.timesCorrect + progress.timesWrong;
  if (legacyTotal >= 3 && progress.timesCorrect / legacyTotal >= 0.7) return "production";
  return "recognition";
}

function vocabularyItem(
  wordById: Map<string, VocabularyItem>,
  progress: Record<string, VocabularyProgress>,
  id: string,
  source: VocabularyPlanSource,
  mode = modeForWord(progress[id])
): PlannerItem | null {
  const word = wordById.get(id);
  return word ? { kind: "vocabulary", wordId: id, word, mode, source, estimatedMinutes: 0.5 } : null;
}

function uniqueKnownIds(ids: string[], wordById: Map<string, VocabularyItem>): string[] {
  return [...new Set(ids)].filter((id) => wordById.has(id));
}

function appendDistinct(
  target: DailySessionItem[],
  items: DailySessionItem[],
  maximum: number,
  keys: Set<string>
) {
  for (const item of items) {
    if (target.length >= maximum) return;
    const key = item.kind === "grammar"
      ? `grammar:${item.grammarId}`
      : `${item.source}:${item.wordId}`;
    if (keys.has(key)) continue;
    keys.add(key);
    target.push(item);
  }
}

export function buildDailyPlan(
  allWords: VocabularyItem[],
  vocabularyProgress: Record<string, VocabularyProgress>,
  recentMistakeIds: string[] = [],
  options: PlannerOptions = {}
): DailyPlan {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const goal = getDailyGoalNumbers(opts.dailyGoal);
  const targetMinutes = options.availableMinutes ?? goal.minutes;
  const targetItems = Math.max(5, Math.round(targetMinutes * 2));
  const wordById = new Map(allWords.map((word) => [word.id, word]));

  const allDueIds = allWords
    .filter((word) => vocabularyProgress[word.id] && isDueForReview(vocabularyProgress[word.id]))
    .sort((a, b) =>
      (vocabularyProgress[a.id].nextReview ?? "").localeCompare(vocabularyProgress[b.id].nextReview ?? "")
    )
    .map((word) => word.id);
  const reviewBacklog = allDueIds.length;
  const dueIds = allDueIds.slice(0, opts.maxReviewBacklog);
  const mistakeIds = uniqueKnownIds(recentMistakeIds, wordById)
    .filter((id) => !dueIds.includes(id))
    .slice(0, 10);

  const weakIds = allWords
    .filter((word) => {
      const progress = vocabularyProgress[word.id];
      if (!progress || dueIds.includes(word.id) || mistakeIds.includes(word.id)) return false;
      const mastery = getMasteryTracking(progress);
      const trackedTotal = mastery.recognitionTotal + mastery.productionTotal;
      const trackedCorrect = mastery.recognitionCorrect + mastery.productionCorrect;
      const legacyTotal = progress.timesCorrect + progress.timesWrong;
      return trackedTotal > 0
        ? trackedCorrect / trackedTotal < 0.7
        : legacyTotal > 0 && progress.timesCorrect / legacyTotal < 0.7;
    })
    .map((word) => word.id)
    .slice(0, 10);

  const recentIdsFromProgress = Object.entries(vocabularyProgress)
    .filter(([, progress]) => Boolean(progress.lastReviewed))
    .sort(([, a], [, b]) => (b.lastReviewed ?? "").localeCompare(a.lastReviewed ?? ""))
    .map(([id]) => id);
  const excludedForRecent = new Set([...dueIds, ...mistakeIds, ...weakIds]);
  const recentIds = uniqueKnownIds([...opts.recentWordIds, ...recentIdsFromProgress], wordById)
    .filter((id) => !excludedForRecent.has(id))
    .slice(0, 5);

  const excludedForNew = new Set([...dueIds, ...mistakeIds, ...weakIds, ...recentIds]);
  const allNewIds = allWords
    .filter((word) => {
      const progress = vocabularyProgress[word.id];
      return !excludedForNew.has(word.id)
        && (!progress || (progress.timesCorrect === 0 && progress.timesWrong === 0));
    })
    .map((word) => word.id);
  const newLimit = reviewBacklog > opts.largeReviewBacklogThreshold
    ? Math.min(opts.maxNewItems, 3)
    : opts.maxNewItems;
  const newIds = allNewIds.slice(0, newLimit);

  const makeItems = (ids: string[], source: VocabularyPlanSource, mode?: ExerciseMode) =>
    ids.map((id) => vocabularyItem(wordById, vocabularyProgress, id, source, mode)).filter((item): item is PlannerItem => Boolean(item));

  const reviewItems = makeItems(dueIds, "due_review");
  const mistakeItems = makeItems(mistakeIds, "mistake", "production");
  const weakProgressItems = makeItems(weakIds, "weak");
  const weakItems = [...mistakeItems, ...weakProgressItems];
  const recentItems = makeItems(recentIds, "recent");
  const newItems = makeItems(newIds, "new", "recognition");
  const modalitySource = [...reviewItems, ...weakItems, ...recentItems, ...newItems];
  const listeningItems = opts.includeListening
    ? modalitySource.slice(0, 3).map((item) => ({ ...item, mode: "recognition" as const, source: "listening" as const }))
    : [];
  const productiveItems = modalitySource
    .filter((item) => item.mode === "production")
    .slice(0, Math.max(1, Math.round(targetItems * 0.25)));
  const speakingItems = opts.includeSpeaking
    ? modalitySource.slice(0, 2).map((item) => ({ ...item, mode: "production" as const, source: "speaking" as const }))
    : [];
  const grammarItems = opts.grammarWeaknesses.slice(0, 3).map((weakness) => ({
    kind: "grammar" as const,
    grammarId: weakness.id,
    title: weakness.title,
    href: weakness.href,
    source: "grammar" as const,
    estimatedMinutes: 2,
  }));

  const sessionItems: DailySessionItem[] = [];
  const sessionKeys = new Set<string>();
  // Reserve the modalities/grammar the plan promises, then fill the remaining
  // time in learning-priority order.
  appendDistinct(sessionItems, listeningItems.slice(0, 1), targetItems, sessionKeys);
  appendDistinct(sessionItems, productiveItems.slice(0, 1), targetItems, sessionKeys);
  appendDistinct(sessionItems, grammarItems.slice(0, 1), targetItems, sessionKeys);
  appendDistinct(sessionItems, speakingItems.slice(0, 1), targetItems, sessionKeys);
  appendDistinct(
    sessionItems,
    [...reviewItems, ...weakItems, ...recentItems, ...newItems, ...listeningItems, ...productiveItems, ...speakingItems, ...grammarItems],
    targetItems,
    sessionKeys
  );

  return {
    reviewItems,
    weakItems,
    recentItems,
    newItems,
    grammarItems,
    listeningItems,
    productiveItems,
    speakingItems,
    sessionItems,
    reviewBacklog,
    estimatedMinutes: Math.min(
      targetMinutes,
      sessionItems.reduce((total, item) => total + item.estimatedMinutes, 0)
    ),
  };
}
