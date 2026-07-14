"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Volume2 } from "lucide-react";

const OPTIONS = ["Guten Tag", "Danke", "Auf Wiedersehen"] as const;

export function DemoLesson() {
  const [heard, setHeard] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);
  const complete = heard && answer === "Guten Tag" && matched;

  const play = () => {
    setHeard(true);
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Добър ден");
    utterance.lang = "bg-BG";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-5">
      <section className="card">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">1 · Kyrillisch</p>
        <h2 className="mt-2 text-3xl font-bold" lang="bg">Добър ден!</h2>
        <p className="mt-1 text-muted">Dobăr den · Guten Tag!</p>
      </section>
      <section className="card">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">2 · Hören</p>
        <button type="button" onClick={play} className="btn-outline mt-3 w-full" aria-pressed={heard}><Volume2 className="h-5 w-5" /> Phrase anhören</button>
        {heard && <p role="status" className="mt-3 text-sm text-success">Audio wurde abgespielt. Du kannst es beliebig oft wiederholen.</p>}
      </section>
      <fieldset className="card">
        <legend className="font-bold">3 · Was bedeutet „Добър ден“?</legend>
        <div className="mt-3 grid gap-2">
          {OPTIONS.map((option) => (
            <button type="button" key={option} onClick={() => setAnswer(option)} aria-pressed={answer === option} className={`min-h-12 rounded-xl border-2 px-4 text-left ${answer === option ? "border-primary bg-primary-50" : "border-warm-100 bg-white"}`}>{option}</button>
          ))}
        </div>
        {answer && <p role="status" className={`mt-3 text-sm ${answer === "Guten Tag" ? "text-success" : "text-accent"}`}>{answer === "Guten Tag" ? "Richtig – damit begrüßt du jemanden höflich." : "Noch nicht. Versuche es noch einmal."}</p>}
      </fieldset>
      <section className="card">
        <p className="font-bold">4 · Ordne die Phrase zu</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="rounded-xl bg-warm-50 p-3 text-center font-bold" lang="bg">Добър ден</span>
          <button type="button" onClick={() => setMatched(true)} className={`rounded-xl border-2 p-3 ${matched ? "border-success bg-green-50" : "border-warm-100"}`}>Guten Tag</button>
        </div>
      </section>
      <section aria-live="polite" className={`rounded-3xl p-6 text-center ${complete ? "bg-primary text-white" : "bg-warm-50"}`}>
        {complete ? <><CheckCircle2 className="mx-auto mb-2 h-10 w-10" /><h2 className="text-xl font-bold">Demo geschafft</h2><p className="mt-2 text-sm text-white/80">Die Demo speichert keinen Fortschritt. Mit einem Konto bekommst du den vollständigen Lernplan.</p><Link href="/register" className="mt-4 inline-flex rounded-xl bg-white px-5 py-3 font-medium text-primary">Kostenlos registrieren</Link></> : <p className="text-sm text-muted">Höre die Phrase, wähle die richtige Bedeutung und ordne sie zu.</p>}
      </section>
    </div>
  );
}
