import { ExerciseResult, MistakeQueueItem } from "@/types/learning";

export class MistakeQueue {
  private items: MistakeQueueItem[] = [];

  constructor(initialResults: ExerciseResult[] = []) {
    initialResults
      .filter((r) => !r.isPassing && r.vocabularyId)
      .forEach((r) => {
        this.items.push({
          vocabularyId: r.vocabularyId!,
          originalResult: r,
          retryCount: 0,
        });
      });
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
    if (passed) return;
    if (item.retryCount >= 2) return; // max 3 retries (initial + 2 retries)
    this.items.push({
      ...item,
      retryCount: item.retryCount + 1,
    });
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
