"use client";

import { useEffect, useState } from "react";
import { Volume2, Loader2, AlertCircle } from "lucide-react";
import { speak, markUserInteraction, TTSStatus, getTTSLabel, subscribeTTSStatus } from "@/lib/tts";
import { UserProgress } from "@/types";
import { cn } from "@/lib/utils";

interface SpeakButtonProps {
  text: string;
  progress?: UserProgress;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "inline";
  className?: string;
}

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function SpeakButton({
  text,
  progress,
  label,
  size = "md",
  variant = "icon",
  className,
}: SpeakButtonProps) {
  const [status, setStatus] = useState<TTSStatus>("needs-interaction");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeTTSStatus((s) => {
      setStatus(s);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClick = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    markUserInteraction();
    setIsPlaying(true);
    try {
      await speak(text, progress);
    } finally {
      setIsPlaying(false);
    }
  };

  const isError = status === "unsupported" || status === "no-voices";
  const isLoading = isPlaying;

  const icon = isLoading ? (
    <Loader2 className={cn(iconSizes[size], "animate-spin")} />
  ) : isError ? (
    <AlertCircle className={iconSizes[size]} />
  ) : (
    <Volume2 className={iconSizes[size]} />
  );

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={getTTSLabel(status)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          isError
            ? "bg-danger/10 text-danger hover:bg-danger/20"
            : "bg-primary-50 text-primary hover:bg-primary-100",
          isLoading && "opacity-70",
          className
        )}
        aria-label={label || "Vokabel anhören"}
      >
        {icon}
        {label && <span>{label}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={getTTSLabel(status)}
      className={cn(
        "rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
        sizeClasses[size],
        isError
          ? "bg-danger/10 text-danger hover:bg-danger/20"
          : "bg-primary-50 text-primary hover:bg-primary-100",
        isLoading && "opacity-70",
        className
      )}
      aria-label={label || "Vokabel anhören"}
    >
      {icon}
    </button>
  );
}
