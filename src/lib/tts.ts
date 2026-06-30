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

export async function speak(text: string, progress?: UserProgress): Promise<boolean> {
  if (!isBrowser()) return false;

  // Respect user settings
  const settings = progress?.settings;
  if (settings?.ttsEnabled === false) return false;

  // Require interaction first (autoplay policy)
  if (!hasUserInteracted) {
    markUserInteraction();
    // Give browser a moment to unlock
    await new Promise((r) => setTimeout(r, 100));
  }

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

  const rate = settings?.speechRate ?? 0.9;

  // Use Bulgarian voice if available, otherwise any voice
  const voice = bulgarianVoice || availableVoices[0] || null;

  if (!voice && availableVoices.length === 0) {
    setStatus("unsupported");
    return false;
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "bg-BG";
      utterance.rate = rate;
      utterance.pitch = 1;

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
          // If error was because no voice, mark as no-voices
          if (!bulgarianVoice && availableVoices.length > 0) {
            setStatus("no-voices");
          } else {
            setStatus("unsupported");
          }
          resolve(false);
        }
      };

      // Safety timeout
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

export function stopSpeaking(): void {
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
