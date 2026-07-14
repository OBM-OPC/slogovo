"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseItemResult, ExerciseResult, FillInSentence } from "@/types";
import { Button } from "@/components/ui/Button";
import { buildExerciseItemResult, buildExerciseResult } from "@/lib/evaluation";
import { authoredAnswerOptions, evaluateAnswerDetailed } from "@/lib/answer-evaluation";
import { buildEvaluationFeedback, formatRichFeedback } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { BulgarianKeyboard } from "@/components/ui/BulgarianKeyboard";
import { ExerciseFeedback } from "./ExerciseFeedback";

interface FillInExerciseProps {
  exerciseId: string;
  sentences: FillInSentence[];
  attemptNumber?: number;
  onInteraction?: () => void;
  onItemChange?: (index: number, total: number) => void;
  onReviewRequest?: (itemId: string) => void;
  onComplete: (result: ExerciseResult) => void;
}

export function FillInExercise({
  exerciseId,
  sentences,
  attemptNumber = 1,
  onInteraction,
  onItemChange,
  onReviewRequest,
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

  useEffect(() => onItemChange?.(current, sentences.length), [current, onItemChange, sentences.length]);

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
        <Button className="lesson-action" onClick={checkAnswer} fullWidth disabled={!input.trim()}>Prüfen</Button>
      ) : (
        <ExerciseFeedback
          correct={isCorrect}
          correctAnswer={sentence.answers[0] ?? sentence.answer}
          explanation={sentence.explanation || formatRichFeedback(richFeedback)}
          grammarTopicSlug={sentence.grammarTopicSlug}
          grammarError={richFeedback.status === "wrong_form"}
          audioText={sentence.answers[0] ?? sentence.answer}
          nextLabel={current < sentences.length - 1 ? "Weiter" : "Fertig"}
          onNext={handleNext}
          onAddToReview={!isCorrect ? () => onReviewRequest?.(sentence.id) : undefined}
        />
      )}
    </div>
  );
}
