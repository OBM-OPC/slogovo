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

  it("explains a wrong answer and supports review, audio, and keyboard actions", () => {
    const onComplete = vi.fn();
    const onReviewRequest = vi.fn();
    render(
      <QuizExercise
        exerciseId="quiz-feedback"
        questions={[{
          id: "q-feedback",
          question: "Wie sagt man Hallo?",
          options: ["Здравей", "Довиждане"],
          correctOptionIndex: 0,
          explanation: "Здравей ist eine informelle Begrüßung.",
          grammarTopicSlug: "begrussung",
        }]}
        onReviewRequest={onReviewRequest}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Довиждане" }));
    const feedback = screen.getByRole("status");
    expect(feedback.textContent).toContain("Richtige Lösung: Здравей");
    expect(feedback.textContent).toContain("Grammatik-Tipp");
    expect(screen.getByRole("link", { name: "Thema öffnen" }).getAttribute("href")).toBe("/grammatik/begrussung");

    const audio = screen.getByRole("button", { name: "Lösung anhören" });
    const audioClick = vi.spyOn(audio, "click");
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(audioClick).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Später wiederholen" }));
    expect(onReviewRequest).toHaveBeenCalledWith("q-feedback");
    expect(screen.getByRole("button", { name: "Für später vorgemerkt" })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
