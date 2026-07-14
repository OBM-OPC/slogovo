import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SentenceBuilderExercise } from "./SentenceBuilderExercise";

describe("SentenceBuilderExercise", () => {
  it("evaluates word order and preserves productive-answer metadata", () => {
    const onComplete = vi.fn();
    render(
      <SentenceBuilderExercise
        exerciseId="builder-1"
        sentences={[{
          id: "sentence-1",
          words: ["Аз", "съм", "Мария"],
          correctOrder: ["Аз", "съм", "Мария"],
          de: "Ich bin Maria",
          explanation: "Das Verb steht an zweiter Stelle.",
        }]}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Аз zum Satz hinzufügen" }));
    fireEvent.click(screen.getByRole("button", { name: "съм zum Satz hinzufügen" }));
    fireEvent.click(screen.getByRole("button", { name: "Мария zum Satz hinzufügen" }));
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));

    expect(screen.getByText("Richtig – gut erkannt!")).toBeTruthy();
    expect(screen.getByText("Das Verb steht an zweiter Stelle.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      exerciseType: "sentence-builder",
      itemResults: [expect.objectContaining({
        itemId: "sentence-1",
        userAnswer: "Аз съм Мария",
        productive: true,
      })],
    }));
  });
});
