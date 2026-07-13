"use client";

import { useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, FillInSentence } from "@/types";
import { Button } from "@/components/ui/Button";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { authoredAnswerOptions, evaluateAnswerDetailed } from "@/lib/answer-evaluation";
import { buildEvaluationFeedback, formatRichFeedback } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { BulgarianKeyboard } from "@/components/ui/BulgarianKeyboard";

interface FillInExerciseProps {
  exerciseId: string;
  sentences: FillInSentence[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onComplete: (result: ExerciseResult) => void;
}

export function FillInExercise({
  exerciseId,
  sentences,
  attemptNumber = 1,
  onInteraction,
  onComplete,
}: FillInExerciseProps) {
  const exerciseStartedAt = useRef(new Date().toISOString());
  const itemStartedAt = useRef(new Date().toISOString());
  const itemResults = useRef<ExerciseItemResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const sentence = sentences[current];
  const evaluation = evaluateAnswerDetailed(input, {
    ...authoredAnswerOptions(sentence.answer, sentence.answers),
    allowOmittedSubjectPronoun: sentence.allowOmittedSubjectPronoun,
  });
  const richFeedback = buildEvaluationFeedback(
    evaluation,
    sentence.answers,
    sentence.explanation
  );
  const isCorrect = evaluation.status === "correct" || evaluation.status === "typo";

  const checkAnswer = () => {
    if (showResult || !input.trim()) return;
    onInteraction?.();
    const completedAt = new Date().toISOString();
    itemResults.current.push(buildExerciseItemResult({
      itemId: sentence.id,
      userAnswer: input,
      acceptedAnswers: sentence.answers,
      status: evaluation.status,
      durationMs: Date.parse(completedAt) - Date.parse(itemStartedAt.current),
      startedAt: itemStartedAt.current,
      completedAt,
      attemptNumber,
      required: sentence.required,
      productive: true,
      feedback: [formatRichFeedback(richFeedback), sentence.explanation]
        .filter(Boolean)
        .join(" "),
      feedbackStatus: richFeedback.status,
      feedbackNeedsReview: richFeedback.needsNativeReview,
    }));
    setShowResult(true);
  };

  const handleNext = () => {
    onInteraction?.();
    if (current < sentences.length - 1) {
      setCurrent((value) => value + 1);
      setInput("");
      setShowResult(false);
      itemStartedAt.current = new Date().toISOString();
      return;
    }
    onComplete(buildExerciseResult({
      exerciseId,
      exerciseType: "fill-in",
      itemResults: itemResults.current,
      startedAt: exerciseStartedAt.current,
    }));
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium">Ergänze die Antwort:</p>
      {sentence.de && <p className="mb-2 text-center text-base italic text-muted">{sentence.de}</p>}
      <div className="mb-6 rounded-xl bg-gray-50 p-4 text-center text-xl">
        {sentence.parts.map((part, index) => (
          <span key={`${index}-${part}`}>
            {part === "____" ? (
              <span className="inline-block min-w-[80px] border-b-2 border-primary font-semibold text-primary">{input || "…"}</span>
            ) : <span>{part}</span>}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(event) => { onInteraction?.(); setInput(event.target.value); }}
        disabled={showResult}
        placeholder="Antwort eingeben"
        aria-label="Bulgarische Antwort"
        aria-invalid={showResult ? !isCorrect : undefined}
        aria-describedby={showResult ? "fill-in-feedback" : undefined}
        autoComplete="off"
        spellCheck={false}
        lang="bg"
        className={cn(
          "input mb-4 text-center text-lg",
          showResult ? (isCorrect ? "border-success" : "border-danger") : ""
        )}
        onKeyDown={(event) => { if (event.key === "Enter") checkAnswer(); }}
      />
      <BulgarianKeyboard disabled={showResult} onInsert={(character) => setInput((value) => value + character)} />
      {!showResult ? (
        <Button onClick={checkAnswer} fullWidth disabled={!input.trim()}>Prüfen</Button>
      ) : (
        <div className="space-y-3">
          {sentence.explanation && (
            <div className={cn("rounded-xl p-4 text-sm", isCorrect ? "bg-success/10 text-success" : "bg-warm-50 text-muted")}>
              <p className="font-medium">{sentence.explanation}</p>
              {sentence.grammarTopicSlug && (
                <a href={`/grammatik/${sentence.grammarTopicSlug}`} className="mt-2 inline-block text-sm text-primary underline">Zum Grammatikthema</a>
              )}
            </div>
          )}
          <div className={cn("rounded-xl p-4 text-center font-medium", isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            <p id="fill-in-feedback" role="status" aria-live="polite">{formatRichFeedback(richFeedback)}</p>
          </div>
          <Button onClick={handleNext} fullWidth>{current < sentences.length - 1 ? "Weiter" : "Fertig"}</Button>
        </div>
      )}
    </div>
  );
}
