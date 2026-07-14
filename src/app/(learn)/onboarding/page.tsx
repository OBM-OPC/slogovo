"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { recommendLearningPath, type OnboardingAnswers } from "@/lib/onboarding";
import { OnboardingIllustration } from "@/components/brand/Illustrations";

const pathCopy = {
  alphabet: { title: "Kyrillisch zuerst", href: "/alphabet", detail: "Starte mit Buchstaben und Lauten, bevor du in A1 einsteigst." },
  "a1-foundation": { title: "A1-Grundlagen", href: "/kurs/a1-modul-1", detail: "Beginne direkt mit den ersten alltagsnahen A1-Lektionen." },
  "a1-review": { title: "A1-Einstiegscheck", href: "/heute-lernen", detail: "Nutze die adaptive Einheit, um Bekanntes schnell zu bestätigen und Lücken zu finden." },
} as const;

export default function OnboardingPage() {
  const progress = useProgressSafe();
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    knowsCyrillic: progress.settings.onboarding.knowsCyrillic,
    priorBulgarian: progress.settings.onboarding.priorBulgarian,
    knowsSlavicLanguage: progress.settings.onboarding.knowsSlavicLanguage,
    learningGoal: progress.settings.onboarding.learningGoal,
  });
  const [recommended, setRecommended] = useState(progress.settings.onboarding.completed ? progress.settings.onboarding.recommendedPath : null);

  const finish = async () => {
    const recommendedPath = recommendLearningPath(answers);
    await updateSettings({
      showLatin: !answers.knowsCyrillic,
      onboarding: { ...answers, completed: true, recommendedPath },
    });
    setRecommended(recommendedPath);
  };

  return (
    <main className="animate-fade-in min-h-screen px-4 py-6 safe-top pb-28">
      <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-widest text-primary">Persönlicher Einstieg</p><h1 className="mt-1 text-3xl font-serif font-bold">Was passt zu dir?</h1><p className="mt-2 text-muted">Ein kurzer, unbenoteter Check legt nur deinen Startpunkt fest. Du kannst alles später ändern.</p></div><OnboardingIllustration className="hidden h-24 w-32 shrink-0 sm:block" /></div>

      <div className="space-y-5">
        <Choice label="Kannst du Kyrillisch lesen?" value={answers.knowsCyrillic ? "yes" : "no"} options={[['no','Noch nicht'],['yes','Ja']]} onChange={(value) => setAnswers({ ...answers, knowsCyrillic: value === "yes" })} />
        <Choice label="Wie viel Bulgarisch kennst du?" value={answers.priorBulgarian} options={[['none','Noch nichts'],['basic','Ein paar Grundlagen'],['intermediate','Schon recht viel']]} onChange={(value) => setAnswers({ ...answers, priorBulgarian: value as OnboardingAnswers["priorBulgarian"] })} />
        <Choice label="Kennst du eine andere slawische Sprache?" value={answers.knowsSlavicLanguage ? "yes" : "no"} options={[['no','Nein'],['yes','Ja']]} onChange={(value) => setAnswers({ ...answers, knowsSlavicLanguage: value === "yes" })} />
        <Choice label="Was ist dein Hauptziel?" value={answers.learningGoal} options={[['erasmus','Erasmus'],['travel','Reise'],['work','Arbeit'],['family','Familie']]} onChange={(value) => setAnswers({ ...answers, learningGoal: value as OnboardingAnswers["learningGoal"] })} />
        <Choice label="Wie viel Zeit pro Tag?" value={progress.settings.dailyGoal} options={[['light','5 Minuten'],['medium','15 Minuten'],['intense','30 Minuten']]} onChange={(value) => void updateSettings({ dailyGoal: value as typeof progress.settings.dailyGoal })} />
        <Choice label="Lateinische Umschrift anzeigen?" value={progress.settings.showLatin ? "yes" : "no"} options={[['yes','Ja'],['no','Nein']]} onChange={(value) => void updateSettings({ showLatin: value === "yes" })} />
      </div>

      <button className="btn-primary mt-6 w-full" onClick={() => void finish()}>Empfehlung erstellen</button>
      {recommended && <section aria-live="polite" className="card mt-6 border-2 border-primary"><h2 className="text-xl font-bold">{pathCopy[recommended].title}</h2><p className="my-3 text-sm text-muted">{pathCopy[recommended].detail}</p><Link href={pathCopy[recommended].href} className="btn-primary inline-flex">Empfohlenen Weg starten</Link></section>}
    </main>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: Array<[string,string]>; onChange: (value: string) => void }) {
  return <fieldset className="card"><legend className="mb-3 font-bold">{label}</legend><div className="grid gap-2">{options.map(([option,labelText]) => <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 ${value === option ? "border-primary bg-primary-50" : "border-warm-100"}`}><input type="radio" checked={value === option} onChange={() => onChange(option)} /><span>{labelText}</span></label>)}</div></fieldset>;
}
