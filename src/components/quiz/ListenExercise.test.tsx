import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListenExercise } from "./ListenExercise";

vi.mock("@/lib/audio", () => ({ playAudio: vi.fn().mockResolvedValue(true) }));
vi.mock("@/hooks/useProgressSafe", () => ({
  useProgressSafe: () => ({
    userId: "u1",
    settings: { dailyGoal: "medium", ttsEnabled: true, showLatin: true, speechRate: 0.9 },
  }),
}));

describe("ListenExercise", () => {
  it("returns a structured result from the rendered listening UI", async () => {
    const onComplete = vi.fn();
    render(
      <ListenExercise
        exerciseId="listen-1"
        items={[{
          format: "listen-select",
          id: "listen-item-1",
          audioText: "здравей",
          options: [
            { id: "a", de: "Hallo", bg: "здравей" },
            { id: "b", de: "Tschüss", bg: "довиждане" },
          ],
          correctOptionId: "a",
        }]}
        onComplete={onComplete}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Hallo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      exerciseId: "listen-1",
      exerciseType: "listen",
      correctAnswers: 1,
      incorrectAnswers: 0,
      attempts: 1,
    });
    expect(onComplete.mock.calls[0][0].itemResults[0].itemId).toBe("listen-item-1");
  });
});
