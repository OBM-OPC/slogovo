"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Headphones, Mic, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { evaluateAnswerDetailed } from "@/lib/answer-evaluation";
import { getAllModules, getAllVocabulary, getLessonsByModule } from "@/lib/content";
import { buildDailyPlan, type DailyPlan, type DailySessionItem, type GrammarWeakness } from "@/lib/planner";
import { useProgressStore } from "@/stores/useProgressStore";
import { durationBucket, trackLearningEvent } from "@/lib/telemetry";

const SOURCE_LABELS: Record<DailySessionItem["source"], string> = {
  due_review: "Fällige Wiederholung",
  mistake: "Letzter Fehler",
  weak: "Schwachstelle",
  recent: "Kürzlich gelernt",
  new: "Neuer Inhalt",
  grammar: "Grammatik festigen",
  listening: "Hörverstehen",
  speaking: "Sprechen",
};

function currentGrammarWeaknesses(progress: ReturnType<typeof useProgressSafe>): GrammarWeakness[] {
  return getAllModules().flatMap((module) =>
    getLessonsByModule(module.moduleId).flatMap((lesson) => {
      const score = progress.lessonScores[lesson.lessonId];
      if (score === undefined || score >= 70) return [];
      return [{
        id: lesson.lessonId,
        title: lesson.grammar.title,
        href: `/kurs/${module.moduleId}/${lesson.lessonId}`,
        score,
      }];
    })
  );
}

export function DailySessionClient() {
  const progress = useProgressSafe();
  const reviewVocabulary = useProgressStore((state) => state.reviewVocabularyWithDifficulty);
  const addStudyTime = useProgressStore((state) => state.addStudyTime);
  const previewPlan = useMemo(() => {
    const progressEntries = Object.entries(progress.vocabularyProgress);
    const mistakeIds = progressEntries
      .filter(([, item]) => item.timesWrong > 0)
      .sort(([, a], [, b]) => (b.lastReviewed ?? "").localeCompare(a.lastReviewed ?? ""))
      .map(([id]) => id);
    const recentWordIds = progressEntries
      .filter(([, item]) => Boolean(item.lastReviewed))
      .sort(([, a], [, b]) => (b.lastReviewed ?? "").localeCompare(a.lastReviewed ?? ""))
      .map(([id]) => id);
    return buildDailyPlan(getAllVocabulary(), progress.vocabularyProgress, mistakeIds, {
      dailyGoal: progress.settings.dailyGoal,
      recentWordIds,
      grammarWeaknesses: currentGrammarWeaknesses(progress),
      includeListening: true,
      includeSpeaking: true,
    });
  }, [progress]);
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState("");
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const plan = activePlan ?? previewPlan;
  const current = activePlan?.sessionItems[index];

  const advance = async (rating?: "repeat" | "good") => {
    if (!activePlan || !current) return;
    if (current.kind === "vocabulary" && rating) {
      await reviewVocabulary(current.wordId, rating, current.mode);
    }
    const nextIndex = index + 1;
    if (nextIndex >= activePlan.sessionItems.length) {
      const elapsedMs = Date.now() - (startedAt ?? Date.now());
      const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
      const vocabularyCount = activePlan.sessionItems.filter((item) => item.kind === "vocabulary").length;
      await addStudyTime(elapsedMinutes, vocabularyCount);
      trackLearningEvent("daily_session_completed", {
        count: activePlan.sessionItems.length,
        durationBucket: durationBucket(elapsedMs),
      });
      setFinished(true);
      return;
    }
    setIndex(nextIndex);
    setRevealed(false);
    setInput("");
    setAnswerCorrect(null);
  };

  const start = () => {
    setActivePlan(previewPlan);
    setIndex(0);
    setStartedAt(Date.now());
    setFinished(false);
  };

  if (finished && activePlan) {
    return (
      <main className="animate-fade-in px-4 py-6 safe-top">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Tagessession geschafft!</h1>
          <p className="mb-6 text-muted">{activePlan.sessionItems.length} gezielte Lernschritte sind erledigt.</p>
          <Link href="/lernen"><Button fullWidth>Zurück zu Lernen</Button></Link>
        </div>
      </main>
    );
  }

  if (!activePlan) {
    const counts = [
      ["Wiederholen", plan.reviewItems.length + plan.weakItems.length],
      ["Neu", plan.newItems.length],
      ["Hören", plan.listeningItems.length],
      ["Produktion", plan.productiveItems.length],
      ["Sprechen", plan.speakingItems.length],
    ];
    return (
      <main className="animate-fade-in px-4 py-6 safe-top">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/lernen" className="rounded-full bg-gray-100 p-2 text-muted"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Dein Tagesplan</p>
            <h1 className="text-3xl font-bold">Heute lernen</h1>
          </div>
        </header>

        <section className="card mb-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-primary-50 p-3 text-primary"><Sparkles className="h-6 w-6" /></div>
            <div>
              <p className="font-bold">Adaptive Session</p>
              <p className="text-sm text-muted">ca. {Math.max(1, Math.round(plan.estimatedMinutes))} Minuten · {plan.sessionItems.length} Schritte</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {counts.map(([label, count]) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xl font-bold">{count}</p><p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
          {plan.reviewBacklog > 10 && (
            <p className="mt-4 rounded-xl bg-warm-50 p-3 text-sm text-muted">
              Viele Wiederholungen sind fällig. Neue Inhalte wurden heute bewusst begrenzt.
            </p>
          )}
          <Button onClick={start} fullWidth className="mt-5" disabled={plan.sessionItems.length === 0}>Session starten</Button>
        </section>
      </main>
    );
  }

  if (!current) return null;
  const progressValue = index + 1;
  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <header className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>{SOURCE_LABELS[current.source]}</span>
          <span>{progressValue}/{activePlan.sessionItems.length}</span>
        </div>
        <ProgressBar value={progressValue} max={activePlan.sessionItems.length} />
      </header>

      {current.kind === "grammar" ? (
        <section className="card text-center">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-primary" />
          <p className="mb-2 text-sm text-muted">Grammatik wiederholen</p>
          <h1 className="mb-5 text-2xl font-bold">{current.title}</h1>
          <Link href={current.href}><Button fullWidth variant="outline">Thema öffnen</Button></Link>
          <Button onClick={() => void advance()} fullWidth className="mt-3">Weiter</Button>
        </section>
      ) : current.source === "speaking" ? (
        <section className="card text-center">
          <Mic className="mx-auto mb-4 h-10 w-10 text-primary" />
          <p className="mb-2 text-muted">Sprich laut:</p>
          <p className="mb-6 text-3xl font-bold">{current.word.bg}</p>
          <div className="mb-4"><SpeakButton text={current.word.bg} progress={progress} label="Beispiel anhören" /></div>
          <p className="mb-5 rounded-xl bg-gray-50 p-3 text-sm text-muted">
            Bewerte dich selbst: Slogovo vergibt noch keine automatische Aussprache-Punktzahl.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => void advance("repeat")} variant="outline"><RotateCcw className="h-4 w-4" /> Nochmal</Button>
            <Button onClick={() => void advance("good")}><Check className="h-4 w-4" /> Geschafft</Button>
          </div>
        </section>
      ) : current.mode === "recognition" && current.source !== "listening" ? (
        <section className="card text-center">
          <p className="mb-2 text-sm text-muted">Was heißt das auf Bulgarisch?</p>
          <p className="mb-6 text-3xl font-bold">{current.word.de}</p>
          {revealed ? (
            <>
              <p className="mb-1 text-3xl font-bold text-primary">{current.word.bg}</p>
              {progress.settings.showLatin && current.word.bgLatin && <p className="mb-6 text-sm text-muted">{current.word.bgLatin}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void advance("repeat")} variant="outline"><RotateCcw className="h-4 w-4" /> Nochmal</Button>
                <Button onClick={() => void advance("good")}><Check className="h-4 w-4" /> Gewusst</Button>
              </div>
            </>
          ) : <Button onClick={() => setRevealed(true)} fullWidth>Antwort zeigen</Button>}
        </section>
      ) : (
        <section className="card text-center">
          {current.source === "listening" ? (
            <>
              <Headphones className="mx-auto mb-3 h-9 w-9 text-primary" />
              <p className="mb-4 text-muted">Höre und tippe das bulgarische Wort.</p>
              <div className="mb-5"><SpeakButton text={current.word.bg} progress={progress} label="Wort anhören" /></div>
            </>
          ) : (
            <><p className="mb-2 text-sm text-muted">Tippe auf Bulgarisch:</p><p className="mb-5 text-2xl font-bold">{current.word.de}</p></>
          )}
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={answerCorrect !== null}
            aria-label="Bulgarische Antwort"
            className="input mb-4 text-center text-lg"
          />
          {answerCorrect === null ? (
            <Button
              onClick={() => {
                const evaluation = evaluateAnswerDetailed(input, {
                  acceptedAnswers: [current.word.bg],
                  acceptedTransliterations: current.word.bgLatin ? [current.word.bgLatin] : [],
                });
                setAnswerCorrect(evaluation.status === "correct" || evaluation.status === "typo");
              }}
              disabled={!input.trim()}
              fullWidth
            >Prüfen</Button>
          ) : (
            <>
              <p className={`mb-4 rounded-xl p-3 font-medium ${answerCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                {answerCorrect ? "Richtig!" : `Richtige Antwort: ${current.word.bg}`}
              </p>
              <Button onClick={() => void advance(answerCorrect ? "good" : "repeat")} fullWidth>Weiter</Button>
            </>
          )}
        </section>
      )}
    </main>
  );
}
