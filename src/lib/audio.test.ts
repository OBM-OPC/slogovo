import { describe, expect, it, vi } from "vitest";
import { createAudioState, playAudio } from "./audio";

vi.mock("./tts", () => ({
  speak: vi.fn().mockResolvedValue(true),
  stopSpeaking: vi.fn(),
  subscribeTTSStatus: vi.fn(() => vi.fn()),
}));

describe("audio", () => {
  it("creates default audio state", () => {
    const state = createAudioState();
    expect(state.replayCount).toBe(0);
    expect(state.source).toBe("none");
    expect(state.isPlaying).toBe(false);
  });

  it("falls back to tts when no native asset is provided", async () => {
    const ok = await playAudio("здравей");
    expect(ok).toBe(true);
  });

  it("does not play when asset url is missing", async () => {
    const ok = await playAudio("test", undefined, { id: "x", url: "", isNative: true });
    expect(ok).toBe(true); // falls back to TTS mock
  });
});
