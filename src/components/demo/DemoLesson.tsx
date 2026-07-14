"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Headphones,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

const VOCABULARY = [
  { bg: "Здравей", latin: "Zdravey", de: "Hallo" },
  { bg: "Добър ден", latin: "Dobăr den", de: "Guten Tag" },
  { bg: "Благодаря", latin: "Blagodarya", de: "Danke" },
  { bg: "Моля", latin: "Molya", de: "Bitte" },
  { bg: "Довиждане", latin: "Dovizhdane", de: "Auf Wiedersehen" },
] as const;

const LISTENING_OPTIONS = ["Guten Morgen", "Danke", "Auf Wiedersehen"] as const;
const CORRECT_LISTENING = "Danke";

const MATCHES = [
  { id: "hello", bg: "Здравей", de: "Hallo" },
  { id: "please", bg: "Моля", de: "Bitte" },
  { id: "bye", bg: "Довиждане", de: "Auf Wiedersehen" },
] as const;

type Step = "vocabulary" | "listening" | "matching" | "complete";

export function DemoLesson() {
  const [step, setStep] = useState<Step>("vocabulary");
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [heard, setHeard] = useState(false);
  const [listeningAnswer, setListeningAnswer] = useState<string | null>(null);
  const [selectedBulgarian, setSelectedBulgarian] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchingMessage, setMatchingMessage] = useState<string | null>(null);

  const progress = useMemo(() => {
    if (step === "vocabulary") return ((cardIndex + (revealed ? 1 : 0)) / VOCABULARY.length) * 40;
    if (step === "listening") return listeningAnswer === CORRECT_LISTENING ? 70 : 50;
    if (step === "matching") return 70 + (matchedIds.length / MATCHES.length) * 25;
    return 100;
  }, [cardIndex, listeningAnswer, matchedIds.length, revealed, step]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "bg-BG";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const advanceVocabulary = () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    if (cardIndex === VOCABULARY.length - 1) {
      setStep("listening");
      return;
    }
    setCardIndex((current) => current + 1);
    setRevealed(false);
  };

  const chooseGermanMatch = (id: string) => {
    if (!selectedBulgarian || matchedIds.includes(id)) return;
    if (selectedBulgarian === id) {
      const nextMatches = [...matchedIds, id];
      setMatchedIds(nextMatches);
      setMatchingMessage("Richtig zugeordnet.");
      setSelectedBulgarian(null);
      if (nextMatches.length === MATCHES.length) setTimeout(() => setStep("complete"), 350);
      return;
    }
    const correct = MATCHES.find((item) => item.id === selectedBulgarian);
    setMatchingMessage(`Noch nicht. „${correct?.bg}“ bedeutet „${correct?.de}“.`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-warm-200 bg-white p-4 shadow-card" aria-label="Demo-Fortschritt">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold">Mini-Lektion</span>
          <span className="tabular-nums text-muted">{Math.round(progress)} %</span>
        </div>
        <ProgressBar value={progress} ariaLabel="Fortschritt der Demo-Lektion" />
      </div>

      {step === "vocabulary" && (
        <section className="card min-h-[27rem]" aria-labelledby="demo-vocabulary-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">1 · Wortschatz</p>
              <h2 id="demo-vocabulary-title" className="mt-1 text-xl font-bold">Fünf Wörter für den ersten Kontakt</h2>
            </div>
            <span className="rounded-full bg-warm-100 px-3 py-1 text-xs font-semibold tabular-nums">{cardIndex + 1} / {VOCABULARY.length}</span>
          </div>

          <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-3xl border-2 border-primary-100 bg-primary-50 p-6 text-center">
            <button type="button" onClick={() => speak(VOCABULARY[cardIndex].bg)} className="mb-5 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white text-primary shadow-card" aria-label={`${VOCABULARY[cardIndex].bg} anhören`}>
              <Volume2 className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="text-4xl font-bold" lang="bg">{VOCABULARY[cardIndex].bg}</p>
            <p className="mt-2 text-sm text-primary-700">{VOCABULARY[cardIndex].latin}</p>
            {revealed ? (
              <p className="mt-6 rounded-full bg-white px-5 py-2 text-lg font-bold text-foreground shadow-card" role="status">{VOCABULARY[cardIndex].de}</p>
            ) : (
              <p className="mt-6 text-sm text-primary-700">Tippe unten, um die Bedeutung zu sehen.</p>
            )}
          </div>

          <button type="button" onClick={advanceVocabulary} className="btn-primary mt-5 min-h-14 w-full">
            {revealed ? (cardIndex === VOCABULARY.length - 1 ? "Weiter zur Hörübung" : "Nächstes Wort") : "Bedeutung zeigen"}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </section>
      )}

      {step === "listening" && (
        <section className="card" aria-labelledby="demo-listening-title">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">2 · Hören</p>
          <h2 id="demo-listening-title" className="mt-1 text-xl font-bold">Was hörst du?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Spiele die Phrase ab und wähle ihre Bedeutung.</p>
          <button type="button" onClick={() => { setHeard(true); speak("Благодаря"); }} className="btn-outline mt-5 min-h-14 w-full" aria-pressed={heard}>
            <Headphones className="h-5 w-5" aria-hidden="true" /> {heard ? "Noch einmal anhören" : "Phrase anhören"}
          </button>
          <fieldset className="mt-5" disabled={!heard}>
            <legend className="sr-only">Deutsche Bedeutung auswählen</legend>
            <div className="grid gap-3">
              {LISTENING_OPTIONS.map((option) => {
                const selected = listeningAnswer === option;
                const correct = option === CORRECT_LISTENING;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setListeningAnswer(option)}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-14 items-center rounded-2xl border-2 px-4 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      selected && correct && "border-success bg-primary-50 text-primary-800",
                      selected && !correct && "border-danger bg-accent-50 text-accent-800",
                      !selected && "border-warm-200 bg-white hover:border-primary-200"
                    )}
                  >
                    {selected && (correct ? <Check className="mr-3 h-5 w-5" aria-hidden="true" /> : <X className="mr-3 h-5 w-5" aria-hidden="true" />)}
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {listeningAnswer && (
            <div role="status" className={cn("mt-4 rounded-2xl p-4 text-sm leading-6", listeningAnswer === CORRECT_LISTENING ? "bg-primary-50 text-primary-800" : "bg-accent-50 text-accent-800")}>
              {listeningAnswer === CORRECT_LISTENING ? <><strong>Richtig.</strong> „Благодаря“ bedeutet „Danke“.</> : <><strong>Noch nicht.</strong> Die richtige Antwort ist „Danke“. Spiele die Phrase erneut ab und höre auf die Silben Bla-go-da-rya.</>}
            </div>
          )}
          {listeningAnswer === CORRECT_LISTENING && <button type="button" onClick={() => setStep("matching")} className="btn-primary mt-5 min-h-14 w-full">Weiter zur Zuordnung <ArrowRight className="h-5 w-5" aria-hidden="true" /></button>}
        </section>
      )}

      {step === "matching" && (
        <section className="card" aria-labelledby="demo-matching-title">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">3 · Zuordnen</p>
          <h2 id="demo-matching-title" className="mt-1 text-xl font-bold">Verbinde die Paare</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Wähle zuerst ein bulgarisches Wort und danach die deutsche Bedeutung.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="grid gap-3">
              {MATCHES.map((item) => (
                <button key={item.id} type="button" disabled={matchedIds.includes(item.id)} onClick={() => { setSelectedBulgarian(item.id); setMatchingMessage(null); }} aria-pressed={selectedBulgarian === item.id} className={cn("min-h-14 rounded-2xl border-2 px-2 font-bold disabled:border-success disabled:bg-primary-50 disabled:text-primary", selectedBulgarian === item.id ? "border-primary bg-primary-50" : "border-warm-200 bg-white")} lang="bg">{item.bg}</button>
              ))}
            </div>
            <div className="grid gap-3">
              {[...MATCHES].reverse().map((item) => (
                <button key={item.id} type="button" disabled={matchedIds.includes(item.id)} onClick={() => chooseGermanMatch(item.id)} className="min-h-14 rounded-2xl border-2 border-warm-200 bg-white px-2 font-semibold disabled:border-success disabled:bg-primary-50 disabled:text-primary">{matchedIds.includes(item.id) ? <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" aria-hidden="true" /> {item.de}</span> : item.de}</button>
              ))}
            </div>
          </div>
          {matchingMessage && <p role="status" className={cn("mt-4 rounded-2xl p-4 text-sm", matchingMessage.startsWith("Richtig") ? "bg-primary-50 text-primary-800" : "bg-accent-50 text-accent-800")}>{matchingMessage}</p>}
        </section>
      )}

      {step === "complete" && (
        <section className="overflow-hidden rounded-3xl bg-primary text-white shadow-card" aria-live="polite">
          <div className="p-7 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12" aria-hidden="true" />
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-primary-100">Mini-Lektion geschafft</p>
            <h2 className="mt-2 text-2xl font-bold">Du hast fünf Wörter kennengelernt.</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">Die Demo speichert nichts. Mit einem kostenlosen Konto werden Wiederholungen, Genauigkeit und dein Lernweg sicher für dich festgehalten.</p>
          </div>
          <div className="grid grid-cols-3 border-y border-white/10 bg-white/5 text-center">
            <PreviewMetric value="5" label="Wörter" />
            <PreviewMetric value="100 %" label="Zuordnung" />
            <PreviewMetric value="1" label="Hörübung" />
          </div>
          <div className="space-y-3 p-6">
            <Link href="/register" className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold text-primary">Lernweg kostenlos starten <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            <button type="button" onClick={() => { setStep("vocabulary"); setCardIndex(0); setRevealed(false); setHeard(false); setListeningAnswer(null); setSelectedBulgarian(null); setMatchedIds([]); setMatchingMessage(null); }} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white/80 hover:bg-white/5"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Demo wiederholen</button>
          </div>
        </section>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted"><Sparkles className="h-4 w-4 text-gold-600" aria-hidden="true" /> Keine Anmeldung · Keine dauerhafte Speicherung</p>
    </div>
  );
}

function PreviewMetric({ value, label }: { value: string; label: string }) {
  return <div className="px-2 py-4"><p className="font-bold">{value}</p><p className="mt-1 text-[11px] text-white/65">{label}</p></div>;
}
