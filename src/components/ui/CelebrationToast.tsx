"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { X, Zap, Trophy, Target, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type CelebrationType = "streak" | "consecutive" | "lesson" | "achievement" | "milestone";

export interface CelebrationMessage {
  id: string;
  type: CelebrationType;
  title: string;
  subtitle?: string;
  duration?: number; // ms, default 4000
}

interface CelebrationContextValue {
  showCelebration: (msg: Omit<CelebrationMessage, "id">) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be used within CelebrationProvider");
  return ctx;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const iconMap: Record<CelebrationType, React.ReactNode> = {
  streak: <Flame className="h-6 w-6 text-orange-500" />,
  consecutive: <Zap className="h-6 w-6 text-yellow-500" />,
  lesson: <Trophy className="h-6 w-6 text-primary" />,
  achievement: <Trophy className="h-6 w-6 text-accent" />,
  milestone: <Target className="h-6 w-6 text-success" />,
};

const bgMap: Record<CelebrationType, string> = {
  streak: "bg-orange-50 border-orange-200",
  consecutive: "bg-yellow-50 border-yellow-200",
  lesson: "bg-primary-50 border-primary-200",
  achievement: "bg-accent/10 border-accent/30",
  milestone: "bg-success/10 border-success/30",
};

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<CelebrationMessage[]>([]);

  const showCelebration = useCallback((msg: Omit<CelebrationMessage, "id">) => {
    const id = generateId();
    setMessages((prev) => [...prev, { ...msg, id }]);
    const dur = msg.duration ?? 4000;
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, dur + 300); // extra buffer for exit animation
  }, []);

  return (
    <CelebrationContext.Provider value={{ showCelebration }}>
      {children}
      <CelebrationOverlay messages={messages} onDismiss={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))} />
    </CelebrationContext.Provider>
  );
}

function CelebrationOverlay({
  messages,
  onDismiss,
}: {
  messages: CelebrationMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4">
      {messages.map((msg) => (
        <CelebrationToast key={msg.id} msg={msg} onDismiss={() => onDismiss(msg.id)} />
      ))}
    </div>
  );
}

function CelebrationToast({ msg, onDismiss }: { msg: CelebrationMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 50);
    const exit = setTimeout(() => setVisible(false), (msg.duration ?? 4000) - 300);
    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
    };
  }, [msg.duration]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300",
        bgMap[msg.type],
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}
    >
      <div className="shrink-0 rounded-full bg-white p-2 shadow-sm">{iconMap[msg.type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{msg.title}</p>
        {msg.subtitle && <p className="text-xs text-muted">{msg.subtitle}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-black/5 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
