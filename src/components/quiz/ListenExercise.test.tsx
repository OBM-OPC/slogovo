import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListenExercise } from "./ListenExercise";

const mocks = vi.hoisted(() => ({ playAudio: vi.fn() }));
vi.mock("@/lib/audio", () => ({ playAudioDetailed: mocks.playAudio }));
vi.mock("@/hooks/useProgressSafe", () => ({
  useProgressSafe: () => ({
    userId: "u1",
    settings: { dailyGoal: "medium", ttsEnabled: true, showLatin: true, speechRate: 0.9 },
  }),
}));

describe("ListenExercise", () => {
  beforeEach(() => {
    mocks.playAudio.mockReset().mockResolvedValue({
      ok: true,
      source: "native",
      speed: "normal",
      usedFallback: false,
    });
  });

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

  it("supports normal, slow, cached-source feedback, and one limited reveal", async () => {
    mocks.playAudio.mockResolvedValue({
      ok: true,
      source: "cache",
      speed: "slow",
      usedFallback: false,
    });
    render(
      <ListenExercise
        exerciseId="listen-1"
        items={[{
          format: "audio-comprehension",
          id: "listen-item-1",
          audioText: "Как си?",
          audioUrl: "/audio/how-are-you.mp3",
          slowAudioUrl: "/audio/how-are-you-slow.mp3",
          revealText: "Frage nach dem Befinden",
          maxReveals: 1,
          question: "Was wird gefragt?",
          options: ["Wie geht es dir?", "Wie heißt du?"],
          correctOptionIndex: 0,
        }]}
        onComplete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Langsam abspielen" }));
    await waitFor(() => expect(mocks.playAudio).toHaveBeenCalledWith(
      "Как си?",
      expect.anything(),
      expect.objectContaining({ slowUrl: "/audio/how-are-you-slow.mp3" }),
      "slow"
    ));
    expect(await screen.findByText("Quelle: Gespeicherte Aufnahme")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Hinweis anzeigen/ }));
    expect(screen.getByText("Hinweis: Frage nach dem Befinden")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Hinweis anzeigen/ })).toBeNull();
  });

  it("shows an explicit failure state when authored and fallback audio fail", async () => {
    mocks.playAudio.mockResolvedValue({ ok: false, source: "none", speed: "normal", usedFallback: true });
    render(
      <ListenExercise
        exerciseId="listen-1"
        items={[{
          format: "listen-type",
          id: "listen-item-1",
          audioText: "здравей",
          acceptedAnswers: ["здравей"],
        }]}
        onComplete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Normal abspielen" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Audio konnte nicht abgespielt werden");
  });
});
