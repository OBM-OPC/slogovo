import type { UserSettings } from "@/types";

export type OnboardingAnswers = Omit<UserSettings["onboarding"], "completed" | "recommendedPath">;

export function recommendLearningPath(
  answers: OnboardingAnswers
): UserSettings["onboarding"]["recommendedPath"] {
  if (!answers.knowsCyrillic) return "alphabet";
  if (answers.priorBulgarian === "intermediate") return "a1-review";
  return "a1-foundation";
}
