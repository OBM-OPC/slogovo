import { UserProgress, Achievement } from "@/types";
import { learningMetrics } from "@/lib/gamification";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", icon: "🥾", title: "Erste Meisterschaft", description: "Meistere deine erste Lektion." },
  { id: "seven-day-streak", icon: "🔥", title: "7 echte Lerntage", description: "Lerne an 7 aufeinanderfolgenden Tagen mit messbarer Aktivität." },
  { id: "hundred-vocabulary", icon: "🧠", title: "25 Wörter gemeistert", description: "Bringe 25 Wörter bis zum Mastery-Status." },
  { id: "review-rhythm", icon: "🔁", title: "Wiederholungsrhythmus", description: "Wiederhole an 7 verschiedenen Tagen." },
  { id: "speaking-practice", icon: "🗣️", title: "Aktiv gesprochen", description: "Absolviere 20 produktive Sprech- oder Abrufversuche." },
  { id: "a1-master", icon: "📚", title: "Grammatik-Fundament", description: "Meistere 5 Lektionen mit ihren Grammatikzielen." },
  { id: "world-citizen", icon: "⏱️", title: "120 aktive Minuten", description: "Sammle zwei Stunden tatsächlich gemessene Lernzeit." },
  { id: "weekly-goal", icon: "🎯", title: "Wochenziel", description: "Erreiche dein Tagesziel an 5 der letzten 7 Tage." },
];

export function checkAchievements(progress: UserProgress, now = new Date()): string[] {
  const metrics = learningMetrics(progress, now);
  const eligible = new Set<string>();

  if (progress.masteredLessons.length >= 1) eligible.add("first-steps");
  if (progress.streak.current >= 7) eligible.add("seven-day-streak");
  if (metrics.masteredWords >= 25) eligible.add("hundred-vocabulary");
  if (metrics.distinctReviewDays >= 7) eligible.add("review-rhythm");
  if (metrics.productionAttempts >= 20) eligible.add("speaking-practice");
  if (metrics.masteredGrammarLessons >= 5) eligible.add("a1-master");
  if (metrics.activeMinutes >= 120) eligible.add("world-citizen");
  if (metrics.weeklyGoalDays >= 5) eligible.add("weekly-goal");

  return [...eligible].filter((id) => !progress.achievements.includes(id));
}
