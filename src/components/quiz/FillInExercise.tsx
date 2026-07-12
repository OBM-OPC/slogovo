"use client";

import { useState } from "react";
import { FillInSentence } from "@/types";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/stores/useProgressStore";
import { cn } from "@/lib/utils";

interface FillInExerciseProps {
  sentences: FillInSentence[];
  onComplete: (correct: boolean) => void;
}

export function FillInExercise({ sentences, onComplete }: FillInExerciseProps) {
  const addExerciseResult = useProgressStore((state) => state.addExerciseResult);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  const [anyWrong, setAnyWrong] = useState(false);

  const sentence = sentences[current];
  const explanation = showResult ? sentence.explanation : undefined;
  const grammarSlug = showResult ? sentence.grammarTopicSlug : undefined;

  const checkAnswer = () => {
    const trimmed = input.trim().toLowerCase();
    const isCorrect = sentence.answers.some(
      (a) => a.toLowerCase() === trimmed
    );
    setShowResult(true);
    if (!isCorrect) setAnyWrong(true);
    addExerciseResult(isCorrect);
  };

  const handleNext = () => {
    if (current < sentences.length - 1) {
      setCurrent((c) => c + 1);
      setInput("");
      setShowResult(false);
    } else {
      onComplete(!anyWrong);
    }
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium">Ergänze den Satz:</p>

      {sentence.de && (
        <p className="mb-2 text-center text-base italic text-muted">
          {sentence.parts.map((part, idx) => (
            <span key={idx}>
              {part === "____" ? (
                <span className="inline-block min-w-[60px] border-b border-muted">
                  {input || "…"}
                </span>
              ) : (
                <span>{part}</span>
              )}
            </span>
          ))}
        </p>
      )}

      <div className="mb-6 rounded-xl bg-gray-50 p-4 text-center text-xl">
        {sentence.parts.map((part, idx) => (
          <span key={idx}>
            {part === "____" ? (
              <span className="inline-block min-w-[80px] border-b-2 border-primary font-semibold text-primary">
                {input || "…"}
              </span>
            ) : (
              <span className="bg-text">{part}</span>
            )}
          </span>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={showResult}
        placeholder="Bulgarisches Wort eingeben"
        className={cn(
          "input mb-4 text-center text-lg",
          showResult && sentence.answers.some((a) => a.toLowerCase() === input.trim().toLowerCase())
            ? "border-success focus:border-success focus:ring-success/20"
            : showResult
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : ""
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !showResult) checkAnswer();
        }}
      />

      {!showResult ? (
        <Button onClick={checkAnswer} fullWidth disabled={!input.trim()}>
          Prüfen
        </Button>
      ) : (
        <div className="space-y-3">
          {explanation && (
            <div className={cn(
              "rounded-xl p-4 text-sm",
              sentence.answers.some((a) => a.toLowerCase() === input.trim().toLowerCase())
                ? "bg-success/10 text-success"
                : "bg-warm-50 text-muted"
            )}
            >
              <p className="font-medium">{explanation}</p>
              {grammarSlug && (
                <a
                  href={`/grammatik/${grammarSlug}`}
                  className="mt-2 inline-block text-sm text-primary underline"
                >
                  Zum Grammatikthema
                </a>
              )}
            </div>
          )}
          <div
            className={cn(
              "rounded-xl p-4 text-center font-medium",
              sentence.answers.some((a) => a.toLowerCase() === input.trim().toLowerCase())
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {sentence.answers.some((a) => a.toLowerCase() === input.trim().toLowerCase())
              ? "Richtig!"
              : `Richtige Antwort: ${sentence.answers[0]}`}
          </div>
          <Button onClick={handleNext} fullWidth>
            {current < sentences.length - 1 ? "Weiter" : "Fertig"}
          </Button>
        </div>
      )}
    </div>
  );
}
