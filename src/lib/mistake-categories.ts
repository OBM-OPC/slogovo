import type { MistakeCategory, VocabularyItem, VocabularyProgress } from "@/types";

export function classifyVocabularyMistake(word: VocabularyItem): MistakeCategory {
  const tags = new Set((word.tags ?? []).map((tag) => tag.toLowerCase()));
  if ([...tags].some((tag) => tag.includes("clitic"))) return "bulgarian-clitics";
  if ([...tags].some((tag) => tag.includes("article"))) return "article-usage";
  if ([...tags].some((tag) => tag.includes("gender"))) return "gender-agreement";
  if ([...tags].some((tag) => tag.includes("word-order"))) return "word-order";
  if (word.pos === "verb") return "verb-conjugation";
  return "vocabulary";
}

export function isOpenMistake(progress: VocabularyProgress | undefined): boolean {
  if (!progress || progress.timesWrong <= 0) return false;
  return !progress.improvedAt || (progress.lastMistakeAt ?? "") > progress.improvedAt;
}

export const MISTAKE_CATEGORY_LABELS: Record<MistakeCategory, string> = {
  vocabulary: "Wortschatz",
  "cyrillic-confusion": "Kyrillisch",
  "article-usage": "Artikel",
  "verb-conjugation": "Verbformen",
  "gender-agreement": "Genus/Kongruenz",
  "word-order": "Wortstellung",
  "listening-confusion": "Hörverstehen",
  "bulgarian-clitics": "Klitika",
};
