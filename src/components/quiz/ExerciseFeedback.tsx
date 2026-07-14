"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookmarkCheck, BookmarkPlus, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { cn } from "@/lib/utils";

interface ExerciseFeedbackProps {
  correct: boolean;
  correctAnswer: string;
  explanation?: string;
  grammarTopicSlug?: string;
  grammarError?: boolean;
  audioText?: string;
  nextLabel: string;
  onNext: () => void;
  onAddToReview?: () => void;
}

export function ExerciseFeedback({
  correct,
  correctAnswer,
  explanation,
  grammarTopicSlug,
  grammarError = false,
  audioText,
  nextLabel,
  onNext,
  onAddToReview,
}: ExerciseFeedbackProps) {
  const progress = useProgressSafe();
  const [added, setAdded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const canReplay = Boolean(audioText && /[\u0400-\u04ff]/u.test(audioText));

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "Enter") {
        event.preventDefault();
        onNext();
      }
      if (event.code === "Space" && canReplay) {
        event.preventDefault();
        audioRef.current?.querySelector("button")?.click();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canReplay, onNext]);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className={cn(
        "mt-5 scroll-mt-32 rounded-3xl border p-5 outline-none motion-safe:animate-[lesson-step-in_200ms_ease-out]",
        correct ? "border-success/30 bg-success/10" : "border-danger/25 bg-accent-50"
      )}
    >
      <div className="flex items-start gap-3">
        {correct ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-danger" aria-hidden="true" />}
        <div>
          <h3 className="font-serif text-lg font-bold">{correct ? "Richtig – gut erkannt!" : "Noch nicht ganz"}</h3>
          {!correct && <p className="mt-2 text-sm">Richtige Lösung: <strong lang="bg" className="text-base">{correctAnswer}</strong></p>}
          <p className="mt-2 text-sm leading-6 text-muted">
            {explanation || (correct ? "Du hast die Bedeutung sicher erkannt." : "Vergleiche deine Antwort mit der Lösung und achte auf Wortwahl und Form.")}
          </p>
        </div>
      </div>

      {(grammarError || grammarTopicSlug) && (
        <div className="mt-4 flex gap-2 rounded-2xl bg-white/80 p-3 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
          <div><strong>Grammatik-Tipp:</strong> Prüfe Endung, Person und Satzstellung.
            {grammarTopicSlug && <Link href={`/grammatik/${grammarTopicSlug}`} className="ml-1 font-semibold text-primary underline underline-offset-2">Thema öffnen</Link>}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canReplay && <div ref={audioRef}><SpeakButton text={audioText!} progress={progress} variant="inline" label="Lösung anhören" /></div>}
        {!correct && onAddToReview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={added}
            onClick={() => { onAddToReview(); setAdded(true); }}
          >
            {added ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <BookmarkPlus className="h-4 w-4" aria-hidden="true" />}
            {added ? "Für später vorgemerkt" : "Später wiederholen"}
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">Enter: weiter{canReplay ? " · Leertaste: Audio" : ""}</p>
      <Button className="lesson-action mt-3" onClick={onNext} fullWidth>{nextLabel}</Button>
    </div>
  );
}

