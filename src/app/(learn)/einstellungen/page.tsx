"use client";

import { useProgressSafe } from "@/hooks/useProgressSafe";
import { useProgressStore } from "@/stores/useProgressStore";
import { DailyGoal } from "@/types";
import { getDailyGoalNumbers } from "@/lib/progress-db";
import { Volume2, Type, Target, Gauge, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountControls } from "@/components/account/AccountControls";
import Link from "next/link";

type GoalOption = {
  value: DailyGoal;
  label: string;
  description: string;
  color: string;
};

const goals: GoalOption[] = [
  {
    value: "light",
    label: "Лек",
    description: "5 Min / 10 Wörter",
    color: "bg-primary-50 text-primary",
  },
  {
    value: "medium",
    label: "Среден",
    description: "15 Min / 25 Wörter",
    color: "bg-gold-50 text-gold-700",
  },
  {
    value: "intense",
    label: "Интензивен",
    description: "30 Min / 50 Wörter",
    color: "bg-accent-50 text-accent",
  },
];

export default function EinstellungenPage() {
  const progress = useProgressSafe();
  const updateSettings = useProgressStore((state) => state.updateSettings);

  const { settings } = progress;
  const goal = getDailyGoalNumbers(settings.dailyGoal);

  return (
    <main className="animate-fade-in bg-rose-pattern min-h-screen px-4 py-6 safe-top pb-28">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Настройки</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">Einstellungen</h1>
      </div>

      <Link href="/onboarding" className="mb-6 flex min-h-12 items-center justify-between rounded-2xl bg-primary-50 p-4 font-medium text-primary">
        <span>{settings.onboarding.completed ? "Einstiegsprofil anpassen" : "Persönlichen Einstieg festlegen"}</span>
        <span aria-hidden="true">→</span>
      </Link>

      {/* Daily Goal */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-foreground">Tagesziel</h2>
            <p className="text-xs text-muted">{goal.minutes} Min · {goal.vocabulary} Wörter</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {goals.map((g) => {
            const active = settings.dailyGoal === g.value;
            return (
              <button
                key={g.value}
                onClick={() => updateSettings({ dailyGoal: g.value })}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all duration-200",
                  active
                    ? "border-primary bg-white shadow-card"
                    : "border-transparent bg-white/80 text-muted hover:bg-white hover:shadow-card"
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", g.color)}>
                  {g.label}
                </span>
                <span className="text-xs text-muted">{g.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Toggles */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-card">
        <ToggleRow
          icon={<Volume2 className="h-5 w-5" />}
          label="Sprachausgabe"
          subLabel={settings.ttsEnabled ? "TTS aktiv" : "TTS deaktiviert"}
          color="bg-accent-50 text-accent"
          checked={settings.ttsEnabled}
          onChange={(checked) => updateSettings({ ttsEnabled: checked })}
        />
        <div className="mx-4 h-px bg-warm-100" />
        <ToggleRow
          icon={<Type className="h-5 w-5" />}
          label="Lateinische Umschrift"
          subLabel={settings.showLatin ? "bg-Latin wird angezeigt" : "Nur Kyrillisch"}
          color="bg-gold-50 text-gold-700"
          checked={settings.showLatin}
          onChange={(checked) => updateSettings({ showLatin: checked })}
        />
      </section>

      {/* Speech Rate */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50">
            <Gauge className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-foreground">Sprechtempo</h2>
            <p className="text-xs text-muted">{settings.speechRate.toFixed(1)}x</p>
          </div>
        </div>

        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={settings.speechRate}
          onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>Langsam</span>
          <span>Normal</span>
          <span>Schnell</span>
        </div>
      </section>

      <AccountControls />

      <footer className="mt-6 flex justify-center gap-4 text-xs text-muted">
        <Link href="/datenschutz" className="underline">Datenschutz</Link>
        <Link href="/impressum" className="underline">Impressum</Link>
      </footer>
    </main>
  );
}

function ToggleRow({
  icon,
  label,
  subLabel,
  color,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel: string;
  color: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-foreground">{label}</h3>
          <p className="text-xs text-muted">{subLabel}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-warm-200"
        )}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "left-0.5 translate-x-5" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}
