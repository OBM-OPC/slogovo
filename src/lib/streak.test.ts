import { describe, expect, it } from "vitest";
import { updateStreakForDate } from "./streak";
import { formatDateISO } from "./utils";

describe("local-date streaks", () => {
  it("continues a streak just after local midnight", () => {
    const now = new Date(2026, 6, 13, 0, 5, 0);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = updateStreakForDate({
      current: 4,
      longest: 6,
      lastStudyDate: formatDateISO(yesterday),
    }, now);
    expect(result.current).toBe(5);
    expect(result.lastStudyDate).toBe(formatDateISO(now));
  });
});
