import type { UserSettings } from "@/types";

export type OnboardingAnswers = Omit<UserSettings["onboarding"], "completed" | "recommendedPath">;

const WEEKLY_LEARNING_DAYS: Record<UserSettings["dailyGoal"], number> = {
  light: 5,
  medium: 4,
  intense: 3,
};

export function recommendedWeeklyLearningDays(dailyGoal: UserSettings["dailyGoal"]): number {
  return WEEKLY_LEARNING_DAYS[dailyGoal];
}

export function recommendLearningPath(
  answers: OnboardingAnswers
): UserSettings["onboarding"]["recommendedPath"] {
  if (!answers.knowsCyrillic) return "alphabet";
  if (answers.priorBulgarian === "intermediate") return "a1-review";
  return "a1-foundation";
}
