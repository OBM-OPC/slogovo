"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { AchievementIllustration } from "@/components/brand/Illustrations";
import { triggerConfetti } from "@/lib/confetti";

interface AchievementToastProps {
  achievementIds: string[];
  onClose: () => void;
}

export function AchievementToast({ achievementIds, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (achievementIds.length > 0) triggerConfetti({ scalar: 1.1 });
  }, [achievementIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible && achievementIds.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-4 right-4 top-4 z-50 rounded-2xl bg-accent p-4 text-white shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <AchievementIllustration className="h-16 w-20 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Erfolg freigeschaltet</p>
          {achievementIds.map((id) => {
            const achievement = ACHIEVEMENTS.find((a) => a.id === id);
            return achievement ? (
              <div key={id}>
                <p className="font-bold">
                  {achievement.icon} {achievement.title}
                </p>
                <p className="text-sm text-white/90">{achievement.description}</p>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
