import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuizExercise } from "./QuizExercise";

describe("QuizExercise", () => {
  it("shows answer feedback and emits a structured result", () => {
    const onComplete = vi.fn();
    render(
      <QuizExercise
        exerciseId="quiz-1"
        questions={[{
          id: "q1",
          question: "Was bedeutet Здравей?",
          options: ["Hallo", "Gute Nacht"],
          correctOptionIndex: 0,
          explanation: "Здравей ist die informelle Begrüßung.",
        }]}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Hallo" }));
    expect(screen.getByText("Здравей ist die informelle Begrüßung.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      exerciseId: "quiz-1",
      correctAnswers: 1,
      incorrectAnswers: 0,
      itemResults: [expect.objectContaining({ itemId: "q1", status: "correct" })],
    }));
  });
});
