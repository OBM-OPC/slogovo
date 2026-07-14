import { ACHIEVEMENTS, achievementProgress } from "@/lib/achievements";
import { learningMetrics } from "@/lib/gamification";
import { recommendedWeeklyLearningDays } from "@/lib/onboarding";
import type { ModuleMeta, UserProgress } from "@/types";

export interface DashboardData {
  nextAction: {
    href: string;
    eyebrow: string;
    title: string;
    description: string;
    duration: string;
    moduleTitle: string | null;
    moduleProgress: number;
    moduleCompleted: number;
    moduleTotal: number;
  };
  review: { due: number; estimatedMinutes: number };
  weeklyGoal: { completedDays: number; targetDays: number; percent: number };
  stats: { streak: number; lessons: number; activeMinutes: number; masteredWords: number };
  nextAchievement: { id: string; icon: string; title: string; description: string; current: number; target: number; percent: number } | null;
}

const GOAL_MINUTES: Record<UserProgress["settings"]["dailyGoal"], number> = { light: 5, medium: 15, intense: 30 };

function withinLastSevenDays(date: string, now: Date) {
  const value = new Date(`${date}T00:00:00`);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return !Number.isNaN(value.getTime()) && value >= start && value <= now;
}

export function buildDashboardData(progress: UserProgress, modules: ModuleMeta[], now = new Date()): DashboardData {
  const orderedModules = [...modules].sort((a, b) => a.order - b.order);
  const nextLesson = orderedModules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, module }))).find(({ lessonId }) => !progress.completedLessons.includes(lessonId));
  const currentModule = nextLesson?.module ?? orderedModules.at(-1) ?? null;
  const moduleCompleted = currentModule?.lessons.filter((lesson) => progress.completedLessons.includes(lesson.lessonId)).length ?? 0;
  const moduleTotal = currentModule?.lessons.length ?? 0;
  const reviewDue = Object.values(progress.vocabularyProgress).filter((item) => item.status !== "new" && (!item.nextReview || item.nextReview <= now.toISOString().slice(0, 10))).length;
  const dailyGoalMinutes = GOAL_MINUTES[progress.settings.dailyGoal];
  const weeklyDays = Object.entries(progress.dailyStats).filter(([date, day]) => withinLastSevenDays(date, now) && day.minutes >= dailyGoalMinutes).length;
  const metrics = learningMetrics(progress, now);
  const achievement = ACHIEVEMENTS.find((item) => !progress.achievements.includes(item.id));
  const achievementValue = achievement ? achievementProgress(achievement.id, progress, now) : null;
  const targetDays = recommendedWeeklyLearningDays(progress.settings.dailyGoal);
  const isPersonalizedFirstStep = progress.settings.onboarding.completed && progress.completedLessons.length === 0;
  const personalizedAction = isPersonalizedFirstStep && progress.settings.onboarding.recommendedPath === "alphabet" ? {
    href: "/alphabet",
    eyebrow: "Dein persönlicher Start",
    title: "Kyrillisch lesen lernen",
    description: "Lerne zuerst Buchstaben und Laute – mit Umschrift als Starthilfe.",
    duration: "5 Min.",
    moduleTitle: "Alphabet",
    moduleProgress: 0,
    moduleCompleted: 0,
    moduleTotal: 1,
  } : isPersonalizedFirstStep && progress.settings.onboarding.recommendedPath === "a1-review" ? {
    href: "/heute-lernen",
    eyebrow: "Dein persönlicher Start",
    title: "A1-Einstiegscheck",
    description: "Bestätige Bekanntes und finde gezielt deine nächsten Themen.",
    duration: "5–10 Min.",
    moduleTitle: "A1-Einstiegscheck",
    moduleProgress: 0,
    moduleCompleted: 0,
    moduleTotal: 1,
  } : null;

  return {
    nextAction: personalizedAction ?? (nextLesson ? {
      href: "/heute-lernen",
      eyebrow: "Als Nächstes",
      title: nextLesson.title,
      description: `Weiter in ${nextLesson.module.title}`,
      duration: nextLesson.duration,
      moduleTitle: nextLesson.module.title,
      moduleProgress: moduleTotal === 0 ? 0 : Math.round((moduleCompleted / moduleTotal) * 100),
      moduleCompleted,
      moduleTotal,
    } : {
      href: "/wiederholen",
      eyebrow: "Kurs abgeschlossen",
      title: "Wissen festigen",
      description: "Wiederhole fällige Wörter und sichere deine Fortschritte.",
      duration: reviewDue > 0 ? `${Math.max(1, Math.ceil(reviewDue * 0.3))} Min.` : "5 Min.",
      moduleTitle: currentModule?.title ?? null,
      moduleProgress: 100,
      moduleCompleted,
      moduleTotal,
    }),
    review: { due: reviewDue, estimatedMinutes: reviewDue === 0 ? 0 : Math.max(1, Math.ceil(reviewDue * 0.3)) },
    weeklyGoal: { completedDays: weeklyDays, targetDays, percent: Math.min(100, Math.round((weeklyDays / targetDays) * 100)) },
    stats: { streak: progress.streak.current, lessons: progress.completedLessons.length, activeMinutes: metrics.activeMinutes, masteredWords: metrics.masteredWords },
    nextAchievement: achievement && achievementValue ? { ...achievement, ...achievementValue } : null,
  };
}
