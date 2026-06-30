"use client";

export function isHapticAvailable(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function vibrateFeedback(pattern: number | number[] = 50): void {
  if (!isHapticAvailable()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore unsupported patterns or permission issues
  }
}

export function vibrateCorrect(streak: number): void {
  if (!isHapticAvailable()) return;
  if (streak > 0 && streak % 3 === 0) {
    vibrateFeedback([50, 100, 50]);
  } else {
    vibrateFeedback(50);
  }
}

export function vibrateWrong(): void {
  vibrateFeedback([30, 50, 30]);
}
