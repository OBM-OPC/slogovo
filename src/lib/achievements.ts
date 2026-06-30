import { UserProgress, Achievement } from "@/types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    icon: "🥾",
    title: "Erste Schritte",
    description: "Schließe deine erste Lektion ab.",
  },
  {
    id: "seven-day-streak",
    icon: "🔥",
    title: "7-Tage-Streak",
    description: "Lerne 7 Tage in Folge.",
  },
  {
    id: "hundred-vocabulary",
    icon: "🧠",
    title: "100 Vokabeln",
    description: "Lerne 100 Vokabeln.",
  },
  {
    id: "a1-master",
    icon: "📚",
    title: "A1-Meister",
    description: "Schließe alle A1-Module ab.",
  },
  {
    id: "perfect-quiz",
    icon: "🎯",
    title: "Perfektes Quiz",
    description: "Beantworte 10 Übungen richtig.",
  },
  {
    id: "world-citizen",
    icon: "🌍",
    title: "Weltbürger",
    description: "Halte einen 30-Tage-Streak.",
  },
];

export function checkAchievements(progress: UserProgress): string[] {
  const unlocked: string[] = [];

  if (progress.completedLessons.length >= 1 && !progress.achievements.includes("first-steps")) {
    unlocked.push("first-steps");
  }

  if (progress.streak.current >= 7 && !progress.achievements.includes("seven-day-streak")) {
    unlocked.push("seven-day-streak");
  }

  if (Object.keys(progress.vocabularyProgress).length >= 100 && !progress.achievements.includes("hundred-vocabulary")) {
    unlocked.push("hundred-vocabulary");
  }

  const completedA1Modules = progress.completedModules.filter((id) => id.startsWith("a1-"));
  if (completedA1Modules.length >= 3 && !progress.achievements.includes("a1-master")) {
    unlocked.push("a1-master");
  }

  if (progress.exerciseStats.correct >= 10 && !progress.achievements.includes("perfect-quiz")) {
    unlocked.push("perfect-quiz");
  }

  if (progress.streak.current >= 30 && !progress.achievements.includes("world-citizen")) {
    unlocked.push("world-citizen");
  }

  return unlocked;
}
