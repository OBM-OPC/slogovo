import { UserProgress, Achievement } from "@/types";
import { learningMetrics } from "@/lib/gamification";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-conversation", icon: "💬", title: "Erstes Gespräch", description: "Löse deine erste produktive Gesprächsaufgabe." },
  { id: "alphabet-mastered", icon: "А", title: "Alphabet gemeistert", description: "Arbeite alle 30 bulgarischen Buchstaben durch." },
  { id: "first-steps", icon: "🥾", title: "Erste Meisterschaft", description: "Meistere deine erste Lektion." },
  { id: "seven-day-streak", icon: "🔥", title: "7 echte Lerntage", description: "Lerne an 7 aufeinanderfolgenden Tagen mit messbarer Aktivität." },
  { id: "hundred-vocabulary", icon: "🧠", title: "100 aktive Wörter", description: "Bringe 100 Wörter bis zum Mastery-Status." },
  { id: "review-rhythm", icon: "🔁", title: "Wiederholungsrhythmus", description: "Wiederhole an 7 verschiedenen Tagen." },
  { id: "speaking-practice", icon: "🗣️", title: "Aktiv gesprochen", description: "Absolviere 20 produktive Sprech- oder Abrufversuche." },
  { id: "a1-master", icon: "📚", title: "Grammatik-Fundament", description: "Meistere 5 Lektionen mit ihren Grammatikzielen." },
  { id: "world-citizen", icon: "⏱️", title: "120 aktive Minuten", description: "Sammle zwei Stunden tatsächlich gemessene Lernzeit." },
  { id: "listening-expert", icon: "🎧", title: "Hörprofi", description: "Löse 50 Hörfragen mit mindestens 80% Genauigkeit." },
  { id: "weekly-goal", icon: "🎯", title: "Wochenziel", description: "Erreiche dein persönliches Lektionen-Ziel in einer Woche." },
];

export function achievementProgress(id: string, progress: UserProgress, now = new Date()): { current: number; target: number; percent: number } {
  const metrics = learningMetrics(progress, now);
  const values: Record<string, { current: number; target: number }> = {
    "first-conversation": { current: Math.min(1, metrics.productionAttempts), target: 1 },
    "alphabet-mastered": { current: progress.settings.alphabetCompleted ? 30 : 0, target: 30 },
    "first-steps": { current: progress.masteredLessons.length, target: 1 },
    "seven-day-streak": { current: progress.streak.current, target: 7 },
    "hundred-vocabulary": { current: metrics.masteredWords, target: 100 },
    "review-rhythm": { current: metrics.distinctReviewDays, target: 7 },
    "speaking-practice": { current: metrics.productionAttempts, target: 20 },
    "a1-master": { current: metrics.masteredGrammarLessons, target: 5 },
    "world-citizen": { current: metrics.activeMinutes, target: 120 },
    "listening-expert": { current: Math.min(metrics.listeningTotal, 50), target: 50 },
    "weekly-goal": { current: metrics.weeklyLessons, target: progress.settings.weeklyLessonGoal },
  };
  const value = values[id] ?? { current: 0, target: 1 };
  return { ...value, percent: Math.min(100, Math.round((value.current / value.target) * 100)) };
}

export function checkAchievements(progress: UserProgress, now = new Date()): string[] {
  const metrics = learningMetrics(progress, now);
  const eligible = new Set<string>();

  if (metrics.productionAttempts >= 1) eligible.add("first-conversation");
  if (progress.settings.alphabetCompleted) eligible.add("alphabet-mastered");
  if (progress.masteredLessons.length >= 1) eligible.add("first-steps");
  if (progress.streak.current >= 7) eligible.add("seven-day-streak");
  if (metrics.masteredWords >= 100) eligible.add("hundred-vocabulary");
  if (metrics.distinctReviewDays >= 7) eligible.add("review-rhythm");
  if (metrics.productionAttempts >= 20) eligible.add("speaking-practice");
  if (metrics.masteredGrammarLessons >= 5) eligible.add("a1-master");
  if (metrics.activeMinutes >= 120) eligible.add("world-citizen");
  if (metrics.listeningTotal >= 50 && metrics.listeningCorrect / metrics.listeningTotal >= 0.8) eligible.add("listening-expert");
  if (metrics.weeklyLessons >= progress.settings.weeklyLessonGoal) eligible.add("weekly-goal");

  return [...eligible].filter((id) => !progress.achievements.includes(id));
}
