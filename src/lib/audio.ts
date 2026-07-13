import { speak as ttsSpeak, subscribeTTSStatus, TTSStatus, stopSpeaking as ttsStopSpeaking } from "./tts";
import { UserProgress } from "@/types";

export type AudioSource = "native" | "cache" | "offline" | "tts" | "none";
export type AudioSpeed = "normal" | "slow";

export interface AudioAsset {
  /** Word or sentence id. */
  id: string;
  /** URL/path to normal-speed authored audio. */
  url?: string;
  /** Optional URL/path to authored slow audio. */
  slowUrl?: string;
  /** Optional bundled/downloaded URL used after the network asset fails. */
  offlineUrl?: string;
  /** Stable Cache Storage key, useful when `url` is signed or versioned. */
  cacheKey?: string;
  /** Whether the authored recording is from a native speaker. */
  isNative: boolean;
}

export interface AudioPlaybackResult {
  ok: boolean;
  source: AudioSource;
  speed: AudioSpeed;
  usedFallback: boolean;
}

export interface AudioPlaybackState {
  isLoading: boolean;
  isPlaying: boolean;
  source: AudioSource;
  status: TTSStatus;
  replayCount: number;
}

const AUDIO_CACHE_NAME = "slogovo-audio-v1";
let currentAudio: HTMLAudioElement | null = null;

function cleanupAudio(): void {
  try {
    currentAudio?.pause();
    currentAudio = null;
  } catch {
    // ignore
  }
}

export function stopAudio(): void {
  cleanupAudio();
  ttsStopSpeaking();
}

function cacheRequestUrl(asset: AudioAsset, speed: AudioSpeed): string {
  const key = encodeURIComponent(`${asset.cacheKey ?? asset.id}:${speed}`);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://slogovo.invalid";
  return `${origin}/__audio-cache/${key}`;
}

function authoredUrl(asset: AudioAsset, speed: AudioSpeed): string | undefined {
  return speed === "slow" ? asset.slowUrl || asset.url : asset.url;
}

async function cachedObjectUrl(asset: AudioAsset, speed: AudioSpeed): Promise<string | null> {
  if (typeof caches === "undefined" || typeof URL.createObjectURL !== "function") return null;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(cacheRequestUrl(asset, speed));
    if (!response?.ok) return null;
    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}

/** Downloads an authored asset into Cache Storage for later offline playback. */
export async function cacheAudioAsset(asset: AudioAsset, speed: AudioSpeed = "normal"): Promise<boolean> {
  const url = authoredUrl(asset, speed);
  if (!url || typeof caches === "undefined" || typeof fetch === "undefined") return false;
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.put(cacheRequestUrl(asset, speed), response.clone());
    return true;
  } catch {
    return false;
  }
}

async function playUrl(url: string, playbackRate: number, revokeAfter = false): Promise<boolean> {
  return new Promise((resolve) => {
    currentAudio = new Audio(url);
    currentAudio.playbackRate = playbackRate;
    const finish = (ok: boolean) => {
      cleanupAudio();
      if (revokeAfter) URL.revokeObjectURL(url);
      resolve(ok);
    };
    currentAudio.onended = () => finish(true);
    currentAudio.onerror = () => finish(false);
    currentAudio.play().catch(() => finish(false));
  });
}

function ttsProgress(progress: UserProgress | undefined, speed: AudioSpeed): UserProgress | undefined {
  if (!progress || speed === "normal") return progress;
  return {
    ...progress,
    settings: {
      ...progress.settings,
      speechRate: Math.max(0.5, progress.settings.speechRate * 0.75),
    },
  };
}

export async function playAudioDetailed(
  text: string,
  progress?: UserProgress,
  asset?: AudioAsset,
  speed: AudioSpeed = "normal"
): Promise<AudioPlaybackResult> {
  stopAudio();

  if (asset) {
    const cachedUrl = await cachedObjectUrl(asset, speed);
    const cachedRate = speed === "slow" && !asset.slowUrl ? 0.75 : 1;
    if (cachedUrl && await playUrl(cachedUrl, cachedRate, true)) {
      return { ok: true, source: "cache", speed, usedFallback: false };
    }

    const url = authoredUrl(asset, speed);
    if (url) {
      const rate = speed === "slow" && !asset.slowUrl ? 0.75 : 1;
      if (await playUrl(url, rate)) {
        void cacheAudioAsset(asset, speed);
        return { ok: true, source: "native", speed, usedFallback: false };
      }
    }

    if (asset.offlineUrl && asset.offlineUrl !== url && await playUrl(asset.offlineUrl, speed === "slow" ? 0.75 : 1)) {
      return { ok: true, source: "offline", speed, usedFallback: true };
    }
  }

  const ttsOk = await ttsSpeak(text, ttsProgress(progress, speed));
  return {
    ok: ttsOk,
    source: ttsOk ? "tts" : "none",
    speed,
    usedFallback: Boolean(asset),
  };
}

/** Boolean compatibility wrapper for non-UI callers. */
export async function playAudio(
  text: string,
  progress?: UserProgress,
  asset?: AudioAsset,
  speed: AudioSpeed = "normal"
): Promise<boolean> {
  return (await playAudioDetailed(text, progress, asset, speed)).ok;
}

export function createAudioState(): AudioPlaybackState {
  return {
    isLoading: false,
    isPlaying: false,
    source: "none",
    status: "needs-interaction",
    replayCount: 0,
  };
}

export function useAudioState(callback?: (state: AudioPlaybackState) => void) {
  const state = createAudioState();

  const unsubscribe = subscribeTTSStatus((status) => {
    state.status = status;
    callback?.(state);
  });

  return {
    state,
    unsubscribe,
    trackReplay: () => {
      state.replayCount += 1;
      callback?.(state);
    },
  };
}
