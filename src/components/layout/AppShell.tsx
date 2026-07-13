"use client";

import { useEffect, useState } from "react";
import { useProgressStore } from "@/stores/useProgressStore";
import { useAuth } from "@/hooks/useAuth";
import { initVoices } from "@/lib/tts";
import { AchievementToast } from "@/components/ui/AchievementToast";
import { checkAchievements } from "@/lib/achievements";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const init = useProgressStore((state) => state.init);
  const progress = useProgressStore((state) => state.progress);
  const unlockAchievement = useProgressStore((state) => state.unlockAchievement);
  const [toastAchievements, setToastAchievements] = useState<string[]>([]);
  const { user, isLoading } = useAuth();

  // Initialize progress store once auth is ready
  useEffect(() => {
    if (!isLoading && user) {
      init(user.id);
    }
  }, [init, user, isLoading]);

  useEffect(() => {
    initVoices();
  }, []);

  // Achievement toasts
  useEffect(() => {
    if (!progress) return;
    const newIds = checkAchievements(progress).filter(
      (id) => !progress.achievements.includes(id)
    );
    if (newIds.length > 0) {
      newIds.forEach((id) => unlockAchievement(id));
      setToastAchievements(newIds);
    }
  }, [progress, unlockAchievement]);

  return (
    <div className="mx-auto min-h-screen max-w-md overflow-x-hidden pb-24 safe-bottom">
      {toastAchievements.length > 0 && (
        <AchievementToast
          achievementIds={toastAchievements}
          onClose={() => setToastAchievements([])}
        />
      )}
      {children}
    </div>
  );
}
