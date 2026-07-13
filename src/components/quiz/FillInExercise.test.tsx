import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FillInExercise } from "./FillInExercise";

describe("FillInExercise", () => {
  it("uses shared typo evaluation for feedback and structured results", async () => {
    const onComplete = vi.fn();
    render(
      <FillInExercise
        exerciseId="fill-1"
        sentences={[{
          id: "item-1",
          parts: ["____"],
          answer: "здравей",
          answers: ["здравей", "zdravey"],
          bg: "Здравей!",
        }]}
        onComplete={onComplete}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Antwort eingeben"), {
      target: { value: "здрвей" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));

    expect(screen.getByText(/Fast richtig/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      correctAnswers: 1,
      incorrectAnswers: 0,
      itemResults: [expect.objectContaining({
        status: "typo",
        feedbackStatus: "correct_with_typo",
        isPassing: true,
      })],
    });
  });

  it("labels explicitly authored transliteration as an accepted alternative", () => {
    render(
      <FillInExercise
        exerciseId="fill-1"
        sentences={[{
          id: "item-1",
          parts: ["____"],
          answer: "здравей",
          answers: ["здравей", "zdravey"],
          bg: "Здравей!",
        }]}
        onComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Antwort eingeben"), {
      target: { value: "zdravey" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(screen.getByText(/akzeptierte Alternative/)).toBeTruthy();
  });
});
