"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DifficultyRating, VocabularyItem } from "@/types";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { Button } from "@/components/ui/Button";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { Brain, Check, Clock, RotateCcw, Sparkles, X } from "lucide-react";

interface FlashcardProps {
  words: VocabularyItem[];
}

type SessionStats = Record<DifficultyRating, number>;

const initialStats: SessionStats = {
  repeat: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

const ratingOptions: Array<{
  rating: DifficultyRating;
  label: string;
  shortcut: string;
  className: string;
  icon: typeof X;
}> = [
  {
    rating: "repeat",
    label: "Nochmal",
    shortcut: "1",
    className: "border-danger text-danger hover:bg-danger/10",
    icon: RotateCcw,
  },
  {
    rating: "hard",
    label: "Schwer",
    shortcut: "2",
    className: "border-orange-500 text-orange-600 hover:bg-orange-50",
    icon: Brain,
  },
  {
    rating: "good",
    label: "Gut",
    shortcut: "3",
    className: "border-primary text-primary hover:bg-primary/10",
    icon: Check,
  },
  {
    rating: "easy",
    label: "Einfach",
    shortcut: "4",
    className: "border-success bg-success text-white hover:bg-success/90 hover:text-white",
    icon: Sparkles,
  },
];

function formatDuration(startedAt: number, finishedAt: number): string {
  const seconds = Math.max(1, Math.round((finishedAt - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

export function Flashcard({ words }: FlashcardProps) {
  const progress = useProgressSafe();
  const reviewVocabularyWithDifficulty = useProgressStore((state) => state.reviewVocabularyWithDifficulty);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [stats, setStats] = useState<SessionStats>(initialStats);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now());

  const finished = finishedAt !== null;
  const word = words[index];
  const studied = stats.repeat + stats.hard + stats.good + stats.easy;
  const knownCount = stats.hard + stats.good + stats.easy;
  const accuracy = studied > 0 ? Math.round((knownCount / studied) * 100) : 0;
  const progressPercent = words.length > 0 ? Math.round((studied / words.length) * 100) : 0;

  const cardFace = useMemo(() => {
    if (!word) return null;

    const front = reverseMode ? word.bg : word.de;
    const backMain = reverseMode ? word.de : word.bg;
    const backSub = !reverseMode && progress.settings.showLatin ? word.bgLatin : undefined;

    return { front, backMain, backSub };
  }, [progress.settings.showLatin, reverseMode, word]);

  const resetSession = () => {
    setIndex(0);
    setFlipped(false);
    setFinishedAt(null);
    setConsecutiveCorrect(0);
    setStats(initialStats);
    setSessionStartedAt(Date.now());
    setCardStartedAt(Date.now());
  };

  const handleRating = useCallback((rating: DifficultyRating) => {
    if (!word || finished) return;

    void reviewVocabularyWithDifficulty(word.id, rating, "recognition", {
      responseTimeMs: Date.now() - cardStartedAt,
    });

    setStats((current) => ({ ...current, [rating]: current[rating] + 1 }));

    if (rating === "repeat") {
      setConsecutiveCorrect(0);
      vibrateWrong();
    } else {
      const nextStreak = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextStreak);
      vibrateCorrect(nextStreak);
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        triggerConfetti({ scalar: 1 + Math.min(nextStreak, 10) * 0.05 });
      }
    }

    if (index < words.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
      setCardStartedAt(Date.now());
    } else {
      setFinishedAt(Date.now());
    }
  }, [cardStartedAt, consecutiveCorrect, finished, index, reviewVocabularyWithDifficulty, word, words.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;

      if (event.code === "Space") {
        event.preventDefault();
        if (!finished) setFlipped((current) => !current);
        return;
      }

      if (event.key.toLowerCase() === "r") {
        setReverseMode((current) => !current);
        setFlipped(false);
        return;
      }

      if (!flipped || finished) return;

      const option = ratingOptions.find((item) => item.shortcut === event.key);
      if (option) {
        event.preventDefault();
        handleRating(option.rating);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipped, finished, handleRating]);

  if (words.length === 0) {
    return <p className="text-center text-muted">Keine Vokabeln verfügbar.</p>;
  }

  if (finished) {
    return (
      <div className="card space-y-5 text-center">
        <div>
          <p className="mb-1 text-4xl">🎉</p>
          <h2 className="text-xl font-bold">Session abgeschlossen</h2>
          <p className="text-sm text-muted">{studied} Karten in {formatDuration(sessionStartedAt, finishedAt)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-primary-50 p-3">
            <p className="text-2xl font-bold text-primary">{accuracy}%</p>
            <p className="text-xs text-muted">Trefferquote</p>
          </div>
          <div className="rounded-2xl bg-warm-50 p-3">
            <p className="text-2xl font-bold">{stats.repeat}</p>
            <p className="text-xs text-muted">Nochmal</p>
          </div>
          <div className="rounded-2xl bg-success/10 p-3">
            <p className="text-2xl font-bold text-success">{stats.easy}</p>
            <p className="text-xs text-muted">Einfach</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          {ratingOptions.map((option) => (
            <div key={option.rating} className="rounded-xl bg-gray-50 px-2 py-2">
              <p className="font-bold">{stats[option.rating]}</p>
              <p className="text-muted">{option.label}</p>
            </div>
          ))}
        </div>

        <Button onClick={resetSession} fullWidth>
          Noch eine Runde
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Karte {index + 1} / {words.length}</span>
          <button
            type="button"
            onClick={() => {
              setReverseMode((current) => !current);
              setFlipped(false);
            }}
            className="rounded-full bg-gray-100 px-3 py-1 font-medium text-foreground transition-colors hover:bg-gray-200"
          >
            {reverseMode ? "BG → DE" : "DE → BG"}
          </button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="[perspective:1000px]">
        <div
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.code === "Space") {
              event.preventDefault();
              event.stopPropagation();
              setFlipped((current) => !current);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Karte wieder verdecken" : "Karte aufdecken"}
          className={cn(
            "relative min-h-[260px] cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]"
          )}
        >
          <div className="card absolute inset-0 flex flex-col items-center justify-center text-center [backface-visibility:hidden]">
            <div className="absolute right-4 top-4">
              <SpeakButton text={word.bg} progress={progress} size="md" />
            </div>
            <div className="mb-4 flex items-center gap-1 text-sm text-muted">
              <Clock className="h-4 w-4" /> {reverseMode ? "Bulgarisch → Deutsch" : "Deutsch → Bulgarisch"}
            </div>
            <p className={cn("font-bold", reverseMode ? "text-4xl text-primary" : "text-2xl")} lang={reverseMode ? "bg" : "de"}>{cardFace?.front}</p>
            {reverseMode && progress.settings.showLatin && word.bgLatin && (
              <p className="mt-2 text-sm italic text-muted">{word.bgLatin}</p>
            )}
            <p className="mt-4 text-sm text-muted">Tippen oder Leertaste zum Aufdecken</p>
          </div>

          <div className="card absolute inset-0 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="absolute right-4 top-4">
              <SpeakButton text={word.bg} progress={progress} size="md" />
            </div>
            <div className="mb-4 text-sm text-muted">Bewerte, wie leicht es war</div>
            <p className={cn("font-bold", reverseMode ? "text-2xl" : "text-4xl text-primary")} lang={reverseMode ? "de" : "bg"}>{cardFace?.backMain}</p>
            {cardFace?.backSub && <p className="mt-2 text-sm italic text-muted">{cardFace.backSub}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ratingOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.rating}
              variant="outline"
              onClick={() => handleRating(option.rating)}
              disabled={!flipped}
              fullWidth
              className={cn("flex-col gap-1 py-3", option.className)}
              title={!flipped ? "Erst Karte aufdecken" : undefined}
            >
              <Icon className="h-4 w-4" /> {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
