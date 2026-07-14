"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import {
  recommendLearningPath,
  recommendedWeeklyLearningDays,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { OnboardingIllustration } from "@/components/brand/Illustrations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { UserSettings } from "@/types";

const pathCopy = {
  alphabet: { title: "Kyrillisch zuerst", href: "/alphabet", detail: "Starte mit Buchstaben und Lauten, bevor du in A1 einsteigst." },
  "a1-foundation": { title: "A1-Grundlagen", href: "/kurs/a1-modul-1", detail: "Beginne direkt mit den ersten alltagsnahen A1-Lektionen." },
  "a1-review": { title: "A1-Einstiegscheck", href: "/heute-lernen", detail: "Bestätige Bekanntes und finde gezielt die Themen, die noch Übung brauchen." },
} as const;

type Draft = OnboardingAnswers & Pick<UserSettings, "dailyGoal" | "showLatin">;
type ChoiceOption = { value: string; label: string; detail?: string };

const DEFAULT_DRAFT: Draft = {
  learningGoal: "travel",
  knowsCyrillic: false,
  priorBulgarian: "none",
  knowsSlavicLanguage: false,
  dailyGoal: "medium",
  showLatin: true,
};

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const progress = useProgressSafe();
  const updateSettings = useProgressStore((state) => state.updateSettings);
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    ...progress.settings.onboarding,
    dailyGoal: progress.settings.dailyGoal,
    showLatin: progress.settings.showLatin,
  });
  const [recommended, setRecommended] = useState<UserSettings["onboarding"]["recommendedPath"] | null>(
    progress.settings.onboarding.completed ? progress.settings.onboarding.recommendedPath : null
  );

  const save = async (answers: Draft) => {
    setIsSaving(true);
    const recommendedPath = recommendLearningPath(answers);
    try {
      await updateSettings({
        dailyGoal: answers.dailyGoal,
        showLatin: answers.showLatin,
        onboarding: {
          learningGoal: answers.learningGoal,
          knowsCyrillic: answers.knowsCyrillic,
          priorBulgarian: answers.priorBulgarian,
          knowsSlavicLanguage: answers.knowsSlavicLanguage,
          completed: true,
          recommendedPath,
        },
      });
      setDraft(answers);
      setRecommended(recommendedPath);
    } finally {
      setIsSaving(false);
    }
  };

  if (recommended) {
    const recommendation = pathCopy[recommended];
    return (
      <main className="min-h-screen px-4 py-8 safe-top pb-28 sm:py-12">
        <Card variant="highlighted" className="mx-auto max-w-xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white" aria-hidden="true"><Check /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">Dein persönlicher Start</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">{recommendation.title}</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted">{recommendation.detail}</p>
          <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium">
            Dein Wochenziel: an {recommendedWeeklyLearningDays(draft.dailyGoal)} Tagen lernen
          </p>
          <Link href={recommendation.href} className="btn-primary mt-6 inline-flex w-full justify-center sm:w-auto">
            Empfohlenen Weg starten <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/lernen" className="mt-3 block min-h-11 py-3 text-sm font-semibold text-primary hover:underline">Zum Dashboard</Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 safe-top pb-28 sm:py-10">
      <div className="mx-auto max-w-xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Persönlicher Einstieg</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Dein Lernweg, dein Tempo</h1>
            <p className="mt-2 leading-6 text-muted">Fünf kurze Fragen. Du kannst deine Auswahl später im Profil ändern.</p>
          </div>
          <OnboardingIllustration className="hidden h-24 w-32 shrink-0 sm:block" />
        </header>

        <div className="mt-7" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Schritt {step + 1} von {TOTAL_STEPS}</span>
            <span className="text-muted">{Math.round(((step + 1) / TOTAL_STEPS) * 100)} %</span>
          </div>
          <ProgressBar value={step + 1} max={TOTAL_STEPS} ariaLabel={`Onboarding: Schritt ${step + 1} von ${TOTAL_STEPS}`} />
        </div>

        <section className="mt-6 min-h-[22rem]">
          {step === 0 && <Choice label="Warum lernst du Bulgarisch?" hint="Wir heben passende Alltagssituationen hervor." value={draft.learningGoal} options={[
            { value: "travel", label: "Reisen", detail: "Sicher unterwegs kommunizieren" },
            { value: "erasmus", label: "Erasmus & Studium", detail: "Im Hochschulalltag ankommen" },
            { value: "work", label: "Arbeit", detail: "Berufliche Gespräche meistern" },
            { value: "family", label: "Familie", detail: "Mit Menschen sprechen, die dir wichtig sind" },
          ]} onChange={(value) => setDraft((current) => ({ ...current, learningGoal: value as Draft["learningGoal"] }))} />}

          {step === 1 && <Choice label="Kannst du Kyrillisch lesen?" hint="Damit legen wir fest, ob du zuerst das Alphabet übst." value={draft.knowsCyrillic ? "yes" : "no"} options={[
            { value: "no", label: "Noch nicht" },
            { value: "yes", label: "Ja" },
          ]} onChange={(value) => {
            const knowsCyrillic = value === "yes";
            setDraft((current) => ({ ...current, knowsCyrillic, showLatin: !knowsCyrillic }));
          }} />}

          {step === 2 && <Choice label="Wie viel Bulgarisch kennst du schon?" hint="Vorkenntnisse können deinen Einstieg verkürzen." value={draft.priorBulgarian} options={[
            { value: "none", label: "Noch nichts", detail: "Ich fange ganz neu an" },
            { value: "basic", label: "Ein paar Grundlagen", detail: "Einzelne Wörter und Sätze" },
            { value: "intermediate", label: "Schon recht viel", detail: "Ich möchte mein A1-Wissen prüfen" },
          ]} onChange={(value) => setDraft((current) => ({ ...current, priorBulgarian: value as Draft["priorBulgarian"] }))} />}

          {step === 3 && <Choice label="Wie viel Zeit passt täglich zu dir?" hint="Daraus entsteht ein realistisches Wochenziel." value={draft.dailyGoal} options={[
            { value: "light", label: "5 Minuten", detail: "5 Lerntage pro Woche" },
            { value: "medium", label: "15 Minuten", detail: "4 Lerntage pro Woche" },
            { value: "intense", label: "30 Minuten", detail: "3 Lerntage pro Woche" },
          ]} onChange={(value) => setDraft((current) => ({ ...current, dailyGoal: value as Draft["dailyGoal"] }))} />}

          {step === 4 && <Choice label="Lateinische Umschrift anzeigen?" hint={draft.knowsCyrillic ? "Wir empfehlen ohne Umschrift, weil du Kyrillisch lesen kannst." : "Wir empfehlen Umschrift als Starthilfe. Bulgarisch bleibt immer sichtbar."} value={draft.showLatin ? "yes" : "no"} options={[
            { value: "yes", label: "Ja, als Starthilfe" },
            { value: "no", label: "Nein, nur Kyrillisch" },
          ]} onChange={(value) => setDraft((current) => ({ ...current, showLatin: value === "yes" }))} />}
        </section>

        <div className="mt-6 flex gap-3">
          {step > 0 && <Button variant="outline" aria-label="Zurück" onClick={() => setStep((current) => current - 1)}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Zurück</Button>}
          <Button fullWidth isLoading={isSaving} onClick={() => step === TOTAL_STEPS - 1 ? void save(draft) : setStep((current) => current + 1)}>
            {step === TOTAL_STEPS - 1 ? "Lernweg erstellen" : "Weiter"} {step < TOTAL_STEPS - 1 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
        <Button variant="link" fullWidth disabled={isSaving} className="mt-2 text-muted" onClick={() => void save(DEFAULT_DRAFT)}>Überspringen und empfohlen starten</Button>
      </div>
    </main>
  );
}

function Choice({ label, hint, value, options, onChange }: { label: string; hint: string; value: string; options: ChoiceOption[]; onChange: (value: string) => void }) {
  return (
    <Card className="animate-fade-in">
      <fieldset>
        <legend className="font-serif text-2xl font-bold">{label}</legend>
        <p className="mt-2 text-sm leading-6 text-muted">{hint}</p>
        <div className="mt-5 grid gap-3">
          {options.map((option) => (
            <label key={option.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${value === option.value ? "border-primary bg-primary-50" : "border-warm-200 hover:border-primary-200"}`}>
              <input type="radio" checked={value === option.value} onChange={() => onChange(option.value)} />
              <span><span className="block font-semibold">{option.label}</span>{option.detail && <span className="mt-0.5 block text-sm text-muted">{option.detail}</span>}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}
