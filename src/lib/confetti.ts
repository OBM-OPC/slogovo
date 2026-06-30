"use client";

import confetti from "canvas-confetti";

export type CelebrationType = "streak" | "consecutive" | "lesson" | "achievement" | "milestone";

export interface CelebrationPayload {
  type: CelebrationType;
  title: string;
  subtitle?: string;
  scalar?: number;
}

export type CelebrationCallback = (payload: CelebrationPayload) => void;

let celebrationListener: CelebrationCallback | null = null;

export function setCelebrationListener(cb: CelebrationCallback | null) {
  celebrationListener = cb;
}

function notify(payload: CelebrationPayload) {
  celebrationListener?.(payload);
}

const BULGARIAN_COLORS = ["#009B77", "#FFFFFF", "#D62612"];

export function triggerConfetti(options?: { origin?: { x: number; y: number }; scalar?: number }) {
  const scalar = options?.scalar ?? 1;
  confetti({
    particleCount: Math.floor(80 * scalar),
    spread: 70,
    origin: options?.origin ?? { y: 0.6 },
    colors: BULGARIAN_COLORS,
    gravity: 0.8,
    scalar,
    drift: 0,
    ticks: 200,
    disableForReducedMotion: true,
  });
}

export function triggerStreakConfetti(streak: number) {
  triggerConfetti({ scalar: 1 + Math.min(streak, 10) * 0.1 });
  notify({
    type: "streak",
    title: streak >= 7 ? `${streak}-Tage-Streak! 🔥` : `Streak von ${streak}!`,
    subtitle: streak >= 7 ? "Unglaublich — du bleibst dran!" : "Weiter so!",
    scalar: 1 + Math.min(streak, 10) * 0.1,
  });
}

export function triggerLevelUpConfetti() {
  const end = Date.now() + 1000;
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: BULGARIAN_COLORS,
      gravity: 0.8,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: BULGARIAN_COLORS,
      gravity: 0.8,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
  notify({
    type: "lesson",
    title: "Lektion abgeschlossen! 🎉",
    subtitle: "Super gemacht — du machst Fortschritte!",
  });
}

export function triggerConsecutiveConfetti(count: number) {
  triggerConfetti({ scalar: 1 + Math.min(count, 10) * 0.05 });
  const milestones = [3, 5, 10, 20, 50];
  const isMilestone = milestones.includes(count);
  if (isMilestone) {
    notify({
      type: "milestone",
      title: `${count} richtige Antworten! 🎯`,
      subtitle: "Das ist echte Konzentration!",
    });
  } else if (count >= 3) {
    notify({
      type: "consecutive",
      title: `${count} richtig in Folge! ⚡`,
      subtitle: "Du bist im Fluss!",
    });
  }
}
