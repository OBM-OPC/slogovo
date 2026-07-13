import { Streak } from "@/types";
import { formatDateISO } from "./utils";

export function updateStreakForDate(streak: Streak, now = new Date()): Streak {
  const today = formatDateISO(now);
  if (!streak.lastStudyDate) {
    return { current: 1, longest: Math.max(1, streak.longest), lastStudyDate: today };
  }
  if (streak.lastStudyDate === today) return { ...streak, lastStudyDate: today };

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (streak.lastStudyDate === formatDateISO(yesterday)) {
    const current = streak.current + 1;
    return { current, longest: Math.max(current, streak.longest), lastStudyDate: today };
  }
  return { current: 1, longest: Math.max(1, streak.longest), lastStudyDate: today };
}
