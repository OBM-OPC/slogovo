import { VocabularyProgress } from "@/types";

export interface MasteryTracking {
  /** Recognition-only success count. */
  recognitionCorrect: number;
  /** Recognition-only attempts. */
  recognitionTotal: number;
  /** Production (typing/recall) success count. */
  productionCorrect: number;
  /** Production attempts. */
  productionTotal: number;
}

export function getMasteryTracking(progress: VocabularyProgress): MasteryTracking {
  return {
    recognitionCorrect: progress.recognitionCorrect ?? 0,
    recognitionTotal: progress.recognitionTotal ?? 0,
    productionCorrect: progress.productionCorrect ?? 0,
    productionTotal: progress.productionTotal ?? 0,
  };
}

export function recordRecognitionAttempt(
  progress: VocabularyProgress,
  correct: boolean
): VocabularyProgress {
  const current = getMasteryTracking(progress);
  return {
    ...progress,
    recognitionCorrect: current.recognitionCorrect + (correct ? 1 : 0),
    recognitionTotal: current.recognitionTotal + 1,
  };
}

export function recordProductionAttempt(
  progress: VocabularyProgress,
  correct: boolean
): VocabularyProgress {
  const current = getMasteryTracking(progress);
  return {
    ...progress,
    productionCorrect: current.productionCorrect + (correct ? 1 : 0),
    productionTotal: current.productionTotal + 1,
  };
}

export function isProductivelyMastered(progress: VocabularyProgress): boolean {
  const m = getMasteryTracking(progress);
  if (m.productionTotal < 3) return false;
  return m.productionCorrect / m.productionTotal >= 0.7;
}

export function isReceptivelyMastered(progress: VocabularyProgress): boolean {
  const m = getMasteryTracking(progress);
  if (m.recognitionTotal < 3) return false;
  return m.recognitionCorrect / m.recognitionTotal >= 0.7;
}
