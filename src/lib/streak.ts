import { Streak } from "@/types";
import { formatDateISO } from "./utils";

function weekKey(now: Date): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return formatDateISO(start);
}

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
    return { ...streak, current, longest: Math.max(current, streak.longest), lastStudyDate: today, freezeAppliedOn: undefined };
  }
  const missedDay = new Date(now);
  missedDay.setDate(missedDay.getDate() - 2);
  const currentWeek = weekKey(now);
  if (streak.lastStudyDate === formatDateISO(missedDay) && streak.freezeUsedWeek !== currentWeek) {
    const current = streak.current + 1;
    return {
      current,
      longest: Math.max(current, streak.longest),
      lastStudyDate: today,
      freezeUsedWeek: currentWeek,
      freezeAppliedOn: today,
    };
  }
  return { ...streak, current: 1, longest: Math.max(1, streak.longest), lastStudyDate: today, freezeAppliedOn: undefined };
}
