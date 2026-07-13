"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { VocabularyItem, DifficultyRating } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { speak, markUserInteraction } from "@/lib/tts";
import { cn, shuffleArray } from "@/lib/utils";
import { vibrateCorrect, vibrateWrong } from "@/lib/haptics";
import { triggerConfetti } from "@/lib/confetti";
import { Volume2, Loader2, AlertCircle, Brain, Check, RotateCcw, Sparkles } from "lucide-react";
import { evaluateAnswerDetailed } from "@/lib/answer-evaluation";
import { buildEvaluationFeedback, formatRichFeedback, type RichFeedback } from "@/lib/feedback";


type Phase = "question" | "answer";

interface TypingExerciseProps {
  words: VocabularyItem[];
  mode: "type" | "build";
  onExit?: () => void;
}

const DIFFICULTY_LABELS: Record<DifficultyRating, { label: string; className: string; icon: typeof Check }> = {
  repeat: { label: "Nochmal", className: "bg-danger text-white", icon: RotateCcw },
  hard: { label: "Schwer", className: "bg-orange-500 text-white", icon: Brain },
  good: { label: "Gut", className: "bg-primary text-white", icon: Check },
  easy: { label: "Einfach", className: "bg-success text-white", icon: Sparkles },
};

export function TypingExercise({ words, mode, onExit }: TypingExerciseProps) {
  const progress = useProgressSafe();
  const reviewVocabularyWithDifficulty = useProgressStore((state) => state.reviewVocabularyWithDifficulty);
  const [queue, setQueue] = useState<VocabularyItem[]>(() => shuffleArray(words).slice(0, 20));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<RichFeedback | null>(null);
  const [typedToday, setTypedToday] = useState<Record<string, number>>({});
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [speakState, setSpeakState] = useState<"idle" | "loading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const speakStateRef = useRef(speakState);
  speakStateRef.current = speakState;

  const triggerSpeak = useCallback(
    async (text: string) => {
      if (speakStateRef.current === "loading") return;
      setSpeakState("loading");
      try {
        await speak(text, progress);
        setSpeakState("idle");
      } catch {
        setSpeakState("error");
        setTimeout(() => setSpeakState("idle"), 1500);
      }
    },
    [progress]
  );

  const speakIcon =
    speakState === "loading" ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : speakState === "error" ? (
      <AlertCircle className="h-5 w-5" />
    ) : (
      <Volume2 className="h-5 w-5" />
    );

  useEffect(() => {
    if (phase === "question" && mode === "type" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, mode, index]);

  useEffect(() => {
    if (progress.settings.ttsEnabled && queue[index] && phase === "question") {
      const timer = setTimeout(() => {
        triggerSpeak(queue[index].bg);
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase, queue, progress]);

  const word = queue[index];
  const wordBg = word?.bg ?? "";

  const buildTiles = useMemo(() => {
    const tiles = wordBg.split("");
    const pool = [...tiles];
    const alphabet = "абвгдежзийклмнопрстуфхцчшщъьюя";
    while (pool.length < 12) {
      const c = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!pool.includes(c)) pool.push(c);
    }
    return shuffleArray(pool);
  }, [wordBg]);

  if (queue.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-muted">Keine Vokabeln für diesen Modus verfügbar.</p>
        {onExit && <Button onClick={onExit} className="mt-4">Zurück</Button>}
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-xl font-bold">Runde geschafft! 🎉</h2>
        <p className="mb-4 text-muted">Du hast {queue.length} Vokabeln trainiert.</p>
        {onExit && <Button onClick={onExit} fullWidth>Noch einmal / Zurück</Button>}
      </div>
    );
  }

  const handleCheck = () => {
    const evaluation = evaluateAnswerDetailed(input, {
      acceptedAnswers: [word.bg],
      acceptedTransliterations: word.bgLatin ? [word.bgLatin] : [],
    });
    const feedback = buildEvaluationFeedback(evaluation, [word.bg, word.bgLatin].filter(Boolean) as string[]);
    const correct = evaluation.status === "correct" || evaluation.status === "typo";
    setIsCorrect(correct);
    setAnswerFeedback(feedback);
    setPhase("answer");
    if (correct) {
      const nextStreak = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextStreak);
      vibrateCorrect(nextStreak);
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        triggerConfetti({ scalar: 1 + Math.min(nextStreak, 10) * 0.05 });
      }
    } else {
      setConsecutiveCorrect(0);
      vibrateWrong();
    }
  };

  const handleDifficulty = (rating: DifficultyRating) => {
    reviewVocabularyWithDifficulty(word.id, rating, "production");
    setTypedToday((prev) => ({ ...prev, [word.id]: (prev[word.id] || 0) + 1 }));
    if (rating === "repeat" && typedToday[word.id] === 0) {
      setQueue((q) => [...q, word]);
    }
    setInput("");
    setIsCorrect(null);
    setAnswerFeedback(null);
    setPhase("question");
    setIndex((i) => i + 1);
    if (isCorrect && rating !== "repeat") {
      const nextStreak = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextStreak);
      vibrateCorrect(nextStreak);
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        triggerConfetti({ scalar: 1 + Math.min(nextStreak, 10) * 0.05 });
      }
    }
  };

  const handleBuildTileClick = (char: string) => {
    if (phase === "answer") return;
    setInput((prev) => prev + char);
  };

  const handleBuildBackspace = () => {
    if (phase === "answer") return;
    setInput((prev) => prev.slice(0, -1));
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="w-full rounded-2xl bg-primary-50 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-100"
        >
          Zurück zu den Karten
        </button>
      )}

      <div className="card min-h-[220px] flex flex-col items-center justify-center text-center">
        <div className="mb-2 text-sm text-muted">Deutsch → Bulgarisch · {mode === "type" ? "Tippen" : "Bauen"}</div>
        <p className="mb-2 text-2xl font-semibold">{word.de}</p>
        <button
          onClick={() => {
            markUserInteraction();
            triggerSpeak(word.bg);
          }}
          disabled={speakState === "loading"}
          className="rounded-full bg-primary-50 p-2 text-primary transition-colors hover:bg-primary-100 disabled:opacity-70"
          aria-label="Vokabel anhören"
        >
          {speakIcon}
        </button>
      </div>

      {mode === "type" ? (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase === "answer"}
          placeholder="Bulgarische Übersetzung eingeben"
          className={cn(
            "input text-center text-lg",
            phase === "answer" &&
              (isCorrect
                ? "border-success focus:border-success focus:ring-success/20"
                : "border-danger focus:border-danger focus:ring-danger/20")
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && phase === "question") handleCheck();
          }}
        />
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              "min-h-[56px] rounded-xl border-2 border-dashed bg-gray-50 p-3 text-center text-xl font-medium",
              phase === "answer" &&
                (isCorrect
                  ? "border-success text-success"
                  : "border-danger text-danger"),
              phase === "question" && "border-gray-300 text-foreground"
            )}
          >
            {input || <span className="text-sm font-normal text-muted">Tippe die Buchstaben an</span>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {buildTiles.map((char, idx) => (
              <button
                key={`${idx}-${char}`}
                onClick={() => handleBuildTileClick(char)}
                disabled={phase === "answer"}
                className="h-10 w-10 rounded-lg bg-primary-50 text-lg font-semibold text-primary shadow-sm transition-colors hover:bg-primary-100 disabled:opacity-50"
              >
                {char}
              </button>
            ))}
          </div>
          <button
            onClick={handleBuildBackspace}
            disabled={phase === "answer" || input.length === 0}
            className="w-full rounded-xl bg-gray-100 py-2 text-sm font-medium text-muted hover:bg-gray-200 disabled:opacity-50"
          >
            ← Letzter Buchstabe löschen
          </button>
        </div>
      )}

      {phase === "question" && (
        <Button onClick={handleCheck} fullWidth disabled={!input.trim()}>
          Prüfen
        </Button>
      )}

      {phase === "answer" && (
        <div className="space-y-3 animate-fade-in">
          <div
            className={cn(
              "rounded-xl p-4 text-center font-medium",
              isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            )}
          >
            {answerFeedback ? formatRichFeedback(answerFeedback) : `Richtige Antwort: ${word.bg}`}
          </div>
          <p className="text-center text-sm text-muted">Wie schwer war diese Vokabel?</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as DifficultyRating[]).map((rating) => (
              <Button
                key={rating}
                onClick={() => handleDifficulty(rating)}
                fullWidth
                className={DIFFICULTY_LABELS[rating].className}
              >
                {(() => {
                  const Icon = DIFFICULTY_LABELS[rating].icon;
                  return <><Icon className="h-4 w-4" /> {DIFFICULTY_LABELS[rating].label}</>;
                })()}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-muted">
        Karte {index + 1} / {queue.length}
      </div>
    </div>
  );
}
