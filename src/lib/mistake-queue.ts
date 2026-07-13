import { ExerciseResult, MistakeQueueItem } from "@/types/learning";
import { flattenExerciseResults } from "./evaluation";

export class MistakeQueue {
  private items: MistakeQueueItem[] = [];

  constructor(initialResults: ExerciseResult[] = []) {
    for (const result of flattenExerciseResults(initialResults)) {
      if (!result.required || result.isPassing) continue;
      this.items.push({
        exerciseId: result.exerciseId,
        exerciseType: result.exerciseType,
        itemId: result.itemId,
        originalResult: result,
        retryCount: 0,
      });
    }
  }

  hasNext(): boolean {
    return this.items.length > 0;
  }

  peek(): MistakeQueueItem | undefined {
    return this.items[0];
  }

  next(): MistakeQueueItem | undefined {
    return this.items.shift();
  }

  retry(item: MistakeQueueItem, passed: boolean): void {
    if (passed || item.retryCount >= 1) return;
    this.items.push({ ...item, retryCount: item.retryCount + 1 });
  }

  size(): number {
    return this.items.length;
  }

  allItems(): MistakeQueueItem[] {
    return [...this.items];
  }
}

export function buildMistakeQueueFromResults(results: ExerciseResult[]): MistakeQueue {
  return new MistakeQueue(results);
}
