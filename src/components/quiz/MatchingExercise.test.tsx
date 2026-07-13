import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchingExercise } from "./MatchingExercise";

describe("MatchingExercise", () => {
  it("keeps corrections inside one screen on the same lesson-flow attempt", async () => {
    const onComplete = vi.fn();
    render(
      <MatchingExercise
        exerciseId="matching-1"
        attemptNumber={1}
        pairs={[
          { id: "item-1", de: "Hallo", bg: "Здравей" },
          { id: "item-2", de: "Danke", bg: "Благодаря" },
        ]}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Hallo" }));
    fireEvent.click(screen.getByRole("button", { name: "Благодаря" }));
    fireEvent.click(screen.getByRole("button", { name: "Hallo" }));
    fireEvent.click(screen.getByRole("button", { name: "Здравей" }));
    fireEvent.click(screen.getByRole("button", { name: "Danke" }));
    fireEvent.click(screen.getByRole("button", { name: "Благодаря" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const result = onComplete.mock.calls[0][0];
    const firstItemAttempts = result.itemResults.filter((item: { itemId: string }) => item.itemId === "item-1");
    expect(firstItemAttempts.map((item: { status: string }) => item.status)).toEqual(["wrong", "correct"]);
    expect(firstItemAttempts.map((item: { attemptNumber: number }) => item.attemptNumber)).toEqual([1, 1]);
  });
});
