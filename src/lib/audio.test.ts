import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheAudioAsset, createAudioState, playAudio, playAudioDetailed } from "./audio";
import { speak } from "./tts";

vi.mock("./tts", () => ({
  speak: vi.fn().mockResolvedValue(true),
  stopSpeaking: vi.fn(),
  subscribeTTSStatus: vi.fn(() => vi.fn()),
}));

class MockAudio {
  static created: MockAudio[] = [];
  src: string;
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
    MockAudio.created.push(this);
  }

  play() {
    queueMicrotask(() => this.src.includes("broken") ? this.onerror?.() : this.onended?.());
    return Promise.resolve();
  }

  pause() {}
}

describe("audio", () => {
  beforeEach(() => {
    MockAudio.created = [];
    vi.stubGlobal("Audio", MockAudio);
    vi.mocked(speak).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates default audio state", () => {
    const state = createAudioState();
    expect(state.replayCount).toBe(0);
    expect(state.source).toBe("none");
    expect(state.isPlaying).toBe(false);
  });

  it("falls back to tts when no native asset is provided", async () => {
    const result = await playAudioDetailed("здравей");
    expect(result).toMatchObject({ ok: true, source: "tts", usedFallback: false });
    expect(await playAudio("здравей")).toBe(true);
  });

  it("uses authored normal and slow recordings", async () => {
    const asset = { id: "x", url: "/normal.mp3", slowUrl: "/slow.mp3", isNative: true };
    expect(await playAudioDetailed("test", undefined, asset, "normal"))
      .toMatchObject({ source: "native", speed: "normal" });
    expect(await playAudioDetailed("test", undefined, asset, "slow"))
      .toMatchObject({ source: "native", speed: "slow" });
    expect(MockAudio.created.map((audio) => audio.src)).toEqual(["/normal.mp3", "/slow.mp3"]);
  });

  it("slows normal audio when no authored slow recording exists", async () => {
    await playAudioDetailed("test", undefined, { id: "x", url: "/normal.mp3", isNative: true }, "slow");
    expect(MockAudio.created[0].playbackRate).toBe(0.75);
  });

  it("uses an offline recording after network audio fails", async () => {
    const result = await playAudioDetailed("test", undefined, {
      id: "x",
      url: "/broken.mp3",
      offlineUrl: "/offline.mp3",
      isNative: true,
    });
    expect(result).toMatchObject({ ok: true, source: "offline", usedFallback: true });
  });

  it("plays a cached recording before the network asset", async () => {
    vi.stubGlobal("caches", {
      open: vi.fn().mockResolvedValue({
        match: vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob(["audio"])) }),
      }),
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cached-audio");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const result = await playAudioDetailed("test", undefined, { id: "x", url: "/native.mp3", isNative: true });
    expect(result).toMatchObject({ ok: true, source: "cache" });
    expect(MockAudio.created[0].src).toBe("blob:cached-audio");
  });

  it("can cache authored audio for offline reuse", async () => {
    const put = vi.fn();
    vi.stubGlobal("caches", { open: vi.fn().mockResolvedValue({ put }) });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("audio", { status: 200 })));

    await expect(cacheAudioAsset({ id: "x", url: "/native.mp3", isNative: true })).resolves.toBe(true);
    expect(put).toHaveBeenCalledTimes(1);
  });
});
