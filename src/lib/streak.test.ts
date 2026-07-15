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

  it("uses one missed-day freeze per calendar week", () => {
    const firstReturn = updateStreakForDate({ current: 4, longest: 4, lastStudyDate: "2026-07-12" }, new Date(2026, 6, 14, 12));
    expect(firstReturn).toMatchObject({ current: 5, freezeAppliedOn: "2026-07-14", freezeUsedWeek: "2026-07-13" });

    const secondReturn = updateStreakForDate({ ...firstReturn, lastStudyDate: "2026-07-15" }, new Date(2026, 6, 17, 12));
    expect(secondReturn.current).toBe(1);
  });
});
