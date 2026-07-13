import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TypingExercise } from "./TypingExercise";

const mocks = vi.hoisted(() => ({ review: vi.fn() }));

vi.mock("@/hooks/useProgressSafe", () => ({
  useProgressSafe: () => ({
    userId: "u1",
    settings: { dailyGoal: "medium", ttsEnabled: false, showLatin: true, speechRate: 0.9 },
  }),
}));
vi.mock("@/stores/useProgressStore", () => ({
  useProgressStore: (selector: (state: { reviewVocabularyWithDifficulty: typeof mocks.review }) => unknown) =>
    selector({ reviewVocabularyWithDifficulty: mocks.review }),
}));
vi.mock("@/lib/tts", () => ({ speak: vi.fn(), markUserInteraction: vi.fn() }));
vi.mock("@/lib/haptics", () => ({ vibrateCorrect: vi.fn(), vibrateWrong: vi.fn() }));
vi.mock("@/lib/confetti", () => ({ triggerConfetti: vi.fn() }));

describe("TypingExercise", () => {
  it("shows shared typo feedback instead of local exact-match feedback", () => {
    render(
      <TypingExercise
        words={[{ id: "word-1", de: "Hallo", bg: "здравей", bgLatin: "zdravey" }]}
        mode="type"
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Bulgarische Übersetzung eingeben"), {
      target: { value: "здрвей" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));

    expect(screen.getByText(/Fast richtig/)).toBeTruthy();
    expect(screen.getByText(/Schreibweise: здравей/)).toBeTruthy();
  });
});
