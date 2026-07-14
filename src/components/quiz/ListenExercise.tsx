"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, ListenExerciseItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { playAudioDetailed, type AudioSource, type AudioSpeed } from "@/lib/audio";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import {
  evaluateAudioComprehension,
  evaluateDictation,
  evaluateListenReorder,
  evaluateListenSelect,
  evaluateListenType,
  isProductiveListenItem,
  ListenResult,
  remainingReorderWords,
} from "@/lib/listen-exercise";
import { cn } from "@/lib/utils";
import { trackLearningEvent, trackMonitoringEvent } from "@/lib/telemetry";
import { BulgarianKeyboard } from "@/components/ui/BulgarianKeyboard";

interface ListenExerciseProps {
  exerciseId: string;
  items: ListenExerciseItem[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function ListenExercise({
  exerciseId,
  items,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onComplete,
}: ListenExerciseProps) {
  const progress = useProgressSafe();
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const audioPlayCounts = useRef<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [result, setResult] = useState<ListenResult | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "error">("idle");
  const [activeSpeed, setActiveSpeed] = useState<AudioSpeed | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource>("none");
  const [revealCount, setRevealCount] = useState(0);
  const item = items[current];

  const play = async (speed: AudioSpeed) => {
    onInteraction?.();
    const previousPlays = audioPlayCounts.current[item.id] ?? 0;
    audioPlayCounts.current[item.id] = previousPlays + 1;
    if (previousPlays > 0) {
      trackLearningEvent("audio_replayed", { exerciseId, itemId: item.id, speed, count: previousPlays });
    }
    setAudioState("loading");
    setActiveSpeed(speed);
    const playback = await playAudioDetailed(
      item.audioText,
      progress,
      item.audioUrl || item.slowAudioUrl || item.offlineAudioUrl ? {
        id: item.id,
        url: item.audioUrl,
        slowUrl: item.slowAudioUrl,
        offlineUrl: item.offlineAudioUrl,
        cacheKey: item.audioCacheKey,
        isNative: true,
      } : undefined,
      speed
    );
    setAudioSource(playback.source);
    setAudioState(playback.ok ? "idle" : "error");
    if (!playback.ok) {
      trackMonitoringEvent("audio_failure", {
        exerciseId,
        itemId: item.id,
        source: playback.source,
        speed,
        errorCode: "AUDIO_PLAYBACK_FAILED",
        online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
      });
    }
    setActiveSpeed(null);
  };

  const submit = (evaluation: ListenResult, userAnswer: string) => {
    if (result) return;
    onInteraction?.();
    const completedAt = new Date().toISOString();
    itemResults.current.push(buildExerciseItemResult({
      itemId: item.id,
      userAnswer,
      acceptedAnswers: evaluation.acceptedAnswers,
      status: evaluation.status,
      feedback: evaluation.feedback,
      feedbackStatus: evaluation.richStatus,
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current),
      startedAt: itemStartedAt.current,
      completedAt,
      attemptNumber,
      required: item.required,
      productive: isProductiveListenItem(item),
      vocabularyId: item.vocabularyId,
    }));
    setResult(evaluation);
  };

  const selectOption = (index: number) => {
    if (result) return;
    const optionCount = item.format === "listen-select" || item.format === "audio-comprehension"
      ? item.options.length
      : 0;
    if (index < 0 || index >= optionCount) return;
    setSelectedIndex(index);
    if (item.format === "listen-select") submit(evaluateListenSelect(item, item.options[index].id), item.options[index].id);
    if (item.format === "audio-comprehension") submit(evaluateAudioComprehension(item, index), item.options[index]);
  };

  const checkAnswer = () => {
    if (item.format === "listen-type" && input.trim()) submit(evaluateListenType(item, input), input);
    if (item.format === "dictation" && input.trim()) submit(evaluateDictation(item, input), input);
    if (item.format === "listen-reorder" && selectedOrder.length === item.correctOrder.length) {
      submit(evaluateListenReorder(item, selectedOrder), selectedOrder.join(" "));
    }
  };

  const next = () => {
    onInteraction?.();
    if (current < items.length - 1) {
      setCurrent((value) => value + 1);
      setInput("");
      setSelectedIndex(null);
      setSelectedOrder([]);
      setResult(null);
      setAudioState("idle");
      setActiveSpeed(null);
      setAudioSource("none");
      setRevealCount(0);
      itemStartedAt.current = new Date().toISOString();
      return;
    }
    onComplete(buildExerciseResult({
      exerciseId,
      exerciseType: "listen",
      itemResults: itemResults.current,
      startedAt: exerciseStartedAt.current,
    }));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (!typing && event.code === "Space") {
        event.preventDefault();
        void play("normal");
      }
      if (!typing && /^[1-9]$/.test(event.key)) selectOption(Number(event.key) - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => onItemChange?.(current, items.length), [current, items.length, onItemChange]);

  const renderAnswer = () => {
    if (item.format === "listen-select") {
      return item.options.map((option, index) => {
        const correct = result && option.id === item.correctOptionId;
        const incorrect = result && selectedIndex === index && !correct;
        return <button key={option.id} type="button" disabled={Boolean(result)} aria-pressed={selectedIndex === index} aria-label={`${option.de}${correct ? ", richtig" : incorrect ? ", falsch" : ""}`} onClick={() => selectOption(index)} className={cn("min-h-14 w-full rounded-xl border-2 p-4 text-left transition-colors duration-200", correct ? "border-success bg-success/10 text-success" : incorrect ? "border-danger bg-danger/10 text-danger" : "border-gray-200 hover:bg-gray-50", result && "opacity-80")}>
          <span className="mr-2 text-xs text-muted">{index + 1}</span>{option.de}
        </button>;
      });
    }
    if (item.format === "audio-comprehension") {
      return <>
        <p className="mb-3 font-medium">{item.question}</p>
        {item.options.map((option, index) => {
          const correct = result && index === item.correctOptionIndex;
          const incorrect = result && selectedIndex === index && !correct;
          return <button key={option} type="button" disabled={Boolean(result)} aria-pressed={selectedIndex === index} aria-label={`${option}${correct ? ", richtig" : incorrect ? ", falsch" : ""}`} onClick={() => selectOption(index)} className={cn("min-h-14 w-full rounded-xl border-2 p-4 text-left transition-colors duration-200", correct ? "border-success bg-success/10 text-success" : incorrect ? "border-danger bg-danger/10 text-danger" : "border-gray-200 hover:bg-gray-50", result && "opacity-80")}>
            <span className="mr-2 text-xs text-muted">{index + 1}</span>{option}
          </button>;
        })}
      </>;
    }
    if (item.format === "listen-reorder") {
      const remaining = remainingReorderWords(item.correctOrder, selectedOrder);
      return <>
        <div className="mb-3 min-h-12 rounded-xl border-2 border-dashed border-gray-300 p-3">
          {selectedOrder.map((word, index) => (
            <button key={`${word}-${index}`} type="button" disabled={Boolean(result)} onClick={() => setSelectedOrder((words) => words.filter((_, itemIndex) => itemIndex !== index))} className="m-1 rounded-lg bg-primary-50 px-3 py-2 text-primary">{word}</button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {remaining.map((word) => <button key={word} type="button" disabled={Boolean(result)} onClick={() => setSelectedOrder((words) => [...words, word])} className="rounded-lg border px-3 py-2">{word}</button>)}
        </div>
        {!result && <Button className="lesson-action" onClick={checkAnswer} fullWidth disabled={selectedOrder.length !== item.correctOrder.length}>Prüfen</Button>}
      </>;
    }
    return <>
      <input
        value={input}
        disabled={Boolean(result)}
        onChange={(event) => { onInteraction?.(); setInput(event.target.value); }}
        onKeyDown={(event) => { if (event.key === "Enter") checkAnswer(); }}
        className="input mb-3 text-center"
        placeholder={item.format === "dictation" ? "Gehörten Satz eingeben" : "Gehörtes Wort eingeben"}
        aria-label={item.format === "dictation" ? "Gehörten bulgarischen Satz eingeben" : "Gehörtes bulgarisches Wort eingeben"}
        aria-invalid={result ? !result.correct : undefined}
        autoComplete="off"
        spellCheck={false}
        lang="bg"
      />
      <BulgarianKeyboard disabled={Boolean(result)} onInsert={(character) => setInput((value) => value + character)} />
      {!result && <Button className="lesson-action" onClick={checkAnswer} fullWidth disabled={!input.trim()}>Prüfen</Button>}
    </>;
  };

  const sourceLabel: Record<AudioSource, string> = {
    native: "Native Aufnahme",
    cache: "Gespeicherte Aufnahme",
    offline: "Offline-Aufnahme",
    tts: "TTS-Ersatzstimme",
    none: "",
  };
  const maxReveals = item.revealText ? Math.max(0, item.maxReveals ?? 1) : 0;
  const canReveal = !result && revealCount < maxReveals;

  return (
    <div>
      <p className="mb-3 text-sm text-muted">Höre genau zu. Leertaste: Audio wiederholen.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => void play("normal")} fullWidth variant="outline" disabled={audioState === "loading"}>
          {activeSpeed === "normal" ? "Wird abgespielt…" : "Normal abspielen"}
        </Button>
        <Button onClick={() => void play("slow")} fullWidth variant="outline" disabled={audioState === "loading"}>
          {activeSpeed === "slow" ? "Wird abgespielt…" : "Langsam abspielen"}
        </Button>
      </div>
      {audioSource !== "none" && audioState !== "error" && (
        <p aria-live="polite" className="mt-2 text-center text-xs text-muted">Quelle: {sourceLabel[audioSource]}</p>
      )}
      {audioState === "error" && <p role="alert" className="mt-2 text-sm text-danger">Audio konnte nicht abgespielt werden. Bitte versuche es erneut.</p>}
      {maxReveals > 0 && (
        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-center text-sm">
          {revealCount > 0 && <p className="mb-2 font-medium">Hinweis: {item.revealText}</p>}
          {canReveal && (
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-2"
              onClick={() => {
                onInteraction?.();
                setRevealCount((count) => count + 1);
                trackLearningEvent("hint_used", { exerciseId, itemId: item.id, count: revealCount + 1 });
              }}
            >
              Hinweis anzeigen ({maxReveals - revealCount} übrig)
            </button>
          )}
        </div>
      )}
      <div className="mt-5 space-y-2">{renderAnswer()}</div>
      {result && (
        <div className="mt-4 space-y-3">
          <div role="status" aria-live="polite" className={cn("rounded-xl p-4 text-center font-medium", result.correct ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>{result.feedback}</div>
          <Button className="lesson-action" onClick={next} fullWidth>{current < items.length - 1 ? "Weiter" : "Fertig"}</Button>
        </div>
      )}
      {selectedIndex !== null && <span className="sr-only">Auswahl {selectedIndex + 1}</span>}
    </div>
  );
}
