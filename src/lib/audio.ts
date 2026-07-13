import { speak as ttsSpeak, subscribeTTSStatus, TTSStatus, stopSpeaking as ttsStopSpeaking } from "./tts";
import { UserProgress } from "@/types";

export type AudioSource = "native" | "tts" | "none";

export interface AudioAsset {
  /** Word or sentence id. */
  id: string;
  /** URL/path to normal-speed audio. */
  url: string;
  /** Optional URL/path to slow audio. */
  slowUrl?: string;
  /** Whether the audio is from a native speaker. */
  isNative: boolean;
}

export interface AudioPlaybackState {
  isLoading: boolean;
  isPlaying: boolean;
  source: AudioSource;
  status: TTSStatus;
  replayCount: number;
}

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

export async function playAudio(
  text: string,
  progress?: UserProgress,
  asset?: AudioAsset
): Promise<boolean> {
  stopAudio();

  if (asset?.url) {
    return playNativeAudio(asset);
  }

  // Fallback to TTS.
  return ttsSpeak(text, progress);
}

async function playNativeAudio(asset: AudioAsset): Promise<boolean> {
  return new Promise((resolve) => {
    currentAudio = new Audio(asset.url);
    currentAudio.onended = () => {
      cleanupAudio();
      resolve(true);
    };
    currentAudio.onerror = () => {
      cleanupAudio();
      resolve(false);
    };
    currentAudio.play().catch(() => {
      cleanupAudio();
      resolve(false);
    });
  });
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
