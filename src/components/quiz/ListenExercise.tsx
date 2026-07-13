"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, ListenExerciseItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { playAudio } from "@/lib/audio";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import {
  evaluateAudioComprehension,
  evaluateDictation,
  evaluateListenReorder,
  evaluateListenSelect,
  evaluateListenType,
  isProductiveListenItem,
  ListenResult,
} from "@/lib/listen-exercise";
import { cn } from "@/lib/utils";

interface ListenExerciseProps {
  exerciseId: string;
  items: ListenExerciseItem[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onComplete: (result: ExerciseResult) => void;
}

export function ListenExercise({
  exerciseId,
  items,
  attemptNumber = 1,
  onInteraction,
  onComplete,
}: ListenExerciseProps) {
  const progress = useProgressSafe();
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [result, setResult] = useState<ListenResult | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "error">("idle");
  const item = items[current];

  const play = async () => {
    onInteraction?.();
    setAudioState("loading");
    const ok = await playAudio(
      item.audioText,
      progress,
      item.audioUrl ? { id: item.id, url: item.audioUrl, isNative: true } : undefined
    );
    setAudioState(ok ? "idle" : "error");
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
        void play();
      }
      if (!typing && /^[1-9]$/.test(event.key)) selectOption(Number(event.key) - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const renderAnswer = () => {
    if (item.format === "listen-select") {
      return item.options.map((option, index) => (
        <button key={option.id} type="button" disabled={Boolean(result)} onClick={() => selectOption(index)} className="w-full rounded-xl border-2 border-gray-200 p-4 text-left hover:bg-gray-50 disabled:opacity-70">
          <span className="mr-2 text-xs text-muted">{index + 1}</span>{option.de}
        </button>
      ));
    }
    if (item.format === "audio-comprehension") {
      return <>
        <p className="mb-3 font-medium">{item.question}</p>
        {item.options.map((option, index) => (
          <button key={option} type="button" disabled={Boolean(result)} onClick={() => selectOption(index)} className="w-full rounded-xl border-2 border-gray-200 p-4 text-left hover:bg-gray-50 disabled:opacity-70">
            <span className="mr-2 text-xs text-muted">{index + 1}</span>{option}
          </button>
        ))}
      </>;
    }
    if (item.format === "listen-reorder") {
      const remaining = item.correctOrder.filter((word) => !selectedOrder.includes(word));
      return <>
        <div className="mb-3 min-h-12 rounded-xl border-2 border-dashed border-gray-300 p-3">
          {selectedOrder.map((word, index) => (
            <button key={`${word}-${index}`} type="button" disabled={Boolean(result)} onClick={() => setSelectedOrder((words) => words.filter((_, itemIndex) => itemIndex !== index))} className="m-1 rounded-lg bg-primary-50 px-3 py-2 text-primary">{word}</button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {remaining.map((word) => <button key={word} type="button" disabled={Boolean(result)} onClick={() => setSelectedOrder((words) => [...words, word])} className="rounded-lg border px-3 py-2">{word}</button>)}
        </div>
        {!result && <Button onClick={checkAnswer} fullWidth disabled={selectedOrder.length !== item.correctOrder.length}>Prüfen</Button>}
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
      />
      {!result && <Button onClick={checkAnswer} fullWidth disabled={!input.trim()}>Prüfen</Button>}
    </>;
  };

  return (
    <div>
      <p className="mb-3 text-sm text-muted">Höre genau zu. Leertaste: Audio wiederholen.</p>
      <Button onClick={() => void play()} fullWidth variant="outline" disabled={audioState === "loading"}>
        {audioState === "loading" ? "Audio wird abgespielt…" : "Audio abspielen"}
      </Button>
      {audioState === "error" && <p role="alert" className="mt-2 text-sm text-danger">Audio konnte nicht abgespielt werden. Bitte versuche es erneut.</p>}
      <div className="mt-5 space-y-2">{renderAnswer()}</div>
      {result && (
        <div className="mt-4 space-y-3">
          <div className={cn("rounded-xl p-4 text-center font-medium", result.correct ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>{result.feedback}</div>
          <Button onClick={next} fullWidth>{current < items.length - 1 ? "Weiter" : "Fertig"}</Button>
        </div>
      )}
      {selectedIndex !== null && <span className="sr-only">Auswahl {selectedIndex + 1}</span>}
    </div>
  );
}
