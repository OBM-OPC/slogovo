import { UserProgress } from "@/types";

// ---------------------------------------------------------------------------
// Simple, robust TTS for Bulgarian
// ---------------------------------------------------------------------------

let voicesLoaded = false;
let hasUserInteracted = false;
let availableVoices: SpeechSynthesisVoice[] = [];
let bulgarianVoice: SpeechSynthesisVoice | null = null;

export type TTSStatus = "ready" | "no-voices" | "unsupported" | "needs-interaction";

let currentStatus: TTSStatus = "needs-interaction";
const statusListeners = new Set<(s: TTSStatus) => void>();

function notifyStatus() {
  statusListeners.forEach((cb) => cb(currentStatus));
}

export function subscribeTTSStatus(cb: (s: TTSStatus) => void) {
  statusListeners.add(cb);
  cb(currentStatus);
  return () => statusListeners.delete(cb);
}

function setStatus(s: TTSStatus) {
  if (currentStatus !== s) {
    currentStatus = s;
    notifyStatus();
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isTTSAvailable(): boolean {
  return isBrowser() && "speechSynthesis" in window;
}

function loadVoices(): void {
  if (!isTTSAvailable()) {
    setStatus("unsupported");
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Voices not loaded yet — wait for event
    return;
  }

  availableVoices = voices;

  // Look for Bulgarian voice
  bulgarianVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith("bg")) ||
    voices.find((v) => v.lang.toLowerCase() === "bg-bg") ||
    null;

  voicesLoaded = true;

  if (bulgarianVoice) {
    setStatus("ready");
  } else if (availableVoices.length > 0) {
    setStatus("no-voices");
  } else {
    setStatus("unsupported");
  }
}

export function initVoices(): void {
  if (!isTTSAvailable()) {
    setStatus("unsupported");
    return;
  }

  // Try immediate load
  loadVoices();

  // Set up voiceschanged listener
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };

  // Chrome sometimes needs a nudge
  if (availableVoices.length === 0) {
    try {
      window.speechSynthesis.cancel();
      // This triggers voice loading on some browsers
      const dummy = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(dummy);
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

// Call this on first user interaction (click, touch, keypress)
export function markUserInteraction(): void {
  if (hasUserInteracted) return;
  hasUserInteracted = true;

  if (!isTTSAvailable()) {
    setStatus("unsupported");
    return;
  }

  // Unlock audio context by speaking empty utterance
  try {
    window.speechSynthesis.cancel();
    const unlock = new SpeechSynthesisUtterance("");
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }

  // Now load voices for real
  initVoices();
}

// Auto-init on module load (voices may already be cached)
if (isBrowser()) {
  initVoices();

  // Also set up global interaction listener
  const handler = () => markUserInteraction();
  window.addEventListener("click", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
}

// ---------------------------------------------------------------------------
// Speak
// ---------------------------------------------------------------------------

let currentAudio: HTMLAudioElement | null = null;
const TTS_CACHE_NAME = "slogovo-generated-audio-v1";

async function ttsCacheRequest(text: string, speed: number): Promise<Request> {
  const bytes = new TextEncoder().encode(`${speed}:${text}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const key = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return new Request(`${window.location.origin}/__tts-cache/${key}`);
}

async function cachedFishResponse(text: string, speed: number): Promise<Response | null> {
  if (typeof caches === "undefined" || !crypto.subtle) return null;
  try {
    const cache = await caches.open(TTS_CACHE_NAME);
    return (await cache.match(await ttsCacheRequest(text, speed))) ?? null;
  } catch {
    return null;
  }
}

async function speakWithFish(text: string, progress?: UserProgress): Promise<boolean> {
  const speed = Math.min(1.1, Math.max(0.75, progress?.settings.speechRate ?? 0.9));
  const cached = await cachedFishResponse(text, speed);
  const response = cached ?? await fetch("/api/tts/fish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      speed,
    }),
  });

  if (!response.ok) return false;
  if (!cached && typeof caches !== "undefined") {
    try {
      const cache = await caches.open(TTS_CACHE_NAME);
      await cache.put(await ttsCacheRequest(text, speed), response.clone());
    } catch {
      // Cache Storage is an optimization; playback remains available without it.
    }
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    currentAudio?.pause();
    currentAudio = new Audio(url);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio?.src === url) currentAudio = null;
    };

    currentAudio.onended = () => {
      cleanup();
      setStatus("ready");
      resolve(true);
    };
    currentAudio.onerror = () => {
      cleanup();
      resolve(false);
    };

    currentAudio.play().catch(() => {
      cleanup();
      resolve(false);
    });
  });
}

async function speakWithBrowser(text: string, progress?: UserProgress): Promise<boolean> {
  if (!isTTSAvailable()) {
    setStatus("unsupported");
    return false;
  }

  // Ensure voices are loaded
  if (!voicesLoaded) {
    initVoices();
    await new Promise((r) => setTimeout(r, 300));
    loadVoices();
  }

  const rate = progress?.settings.speechRate ?? 0.85;
  const voice = bulgarianVoice;

  if (!voice) {
    setStatus(availableVoices.length > 0 ? "no-voices" : "unsupported");
    return false;
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang || "bg-BG";
      utterance.rate = rate;
      utterance.pitch = 0.95;

      let done = false;

      utterance.onend = () => {
        if (!done) {
          done = true;
          setStatus("ready");
          resolve(true);
        }
      };

      utterance.onerror = () => {
        if (!done) {
          done = true;
          setStatus("unsupported");
          resolve(false);
        }
      };

      setTimeout(() => {
        if (!done) {
          done = true;
          resolve(true);
        }
      }, 10000);

      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus("unsupported");
      resolve(false);
    }
  });
}

export async function speak(text: string, progress?: UserProgress): Promise<boolean> {
  if (!isBrowser()) return false;

  const settings = progress?.settings;
  if (settings?.ttsEnabled === false) return false;

  if (!hasUserInteracted) {
    markUserInteraction();
    await new Promise((r) => setTimeout(r, 100));
  }

  setStatus("ready");

  try {
    const fishOk = await speakWithFish(text, progress);
    if (fishOk) return true;
  } catch {
    // Fish is optional; fall back to local browser voice below.
  }

  return speakWithBrowser(text, progress);
}

export function stopSpeaking(): void {
  try {
    currentAudio?.pause();
    currentAudio = null;
  } catch {
    // ignore
  }

  if (isTTSAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

export function getTTSLabel(status: TTSStatus): string {
  switch (status) {
    case "ready":
      return "Sprachausgabe aktiv";
    case "no-voices":
      return "Keine bulgarische Stimme — nutze eine Standard-Stimme";
    case "unsupported":
      return "Sprachausgabe nicht verfügbar";
    case "needs-interaction":
      return "Tippe auf eine Karte, um Audio zu aktivieren";
  }
}
