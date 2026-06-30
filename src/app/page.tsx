import Link from "next/link";
import { BookOpen, Brain, Trophy, Volume2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-rose-pattern">
      {/* Navigation */}
      <nav className="border-b border-warm-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-serif font-bold text-primary">Slogovo</span>
            <span className="h-5 w-px bg-warm-200" />
            <span className="text-sm text-muted cyrillic">Български език</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl px-5 py-2.5 text-sm font-medium text-foreground hover:bg-warm-50 transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover transition-all duration-200"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
        <div className="text-center mb-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Български език за начинаещи
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
            Lerne{" "}
            <span className="text-primary">Bulgarisch</span>
            <br />
            mit Slogovo
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Die interaktive App für deutschsprachige Anfänger. Beginne mit dem kyrillischen Alphabet
            und arbeite dich bis zu deinem ersten Gespräch durch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-8 py-4 text-lg font-medium text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover transition-all duration-200"
            >
              Kostenlos starten
              <span className="text-white/60">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-3xl border-2 border-warm-200 bg-white px-8 py-4 text-lg font-medium text-foreground shadow-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
            >
              Anmelden
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            icon={<BookOpen className="h-7 w-7" />}
            title="Структуриран курс"
            subtitle="Strukturierter Kurs"
            description="Von A1 bis C1 — lerne Schritt für Schritt mit unserem Lektionssystem."
            color="bg-primary-50 text-primary"
          />
          <FeatureCard
            icon={<Brain className="h-7 w-7" />}
            title="Речник"
            subtitle="Vokabeltrainer"
            description="Effektives Lernen mit Karteikarten und Spaced Repetition."
            color="bg-accent-50 text-accent"
          />
          <FeatureCard
            icon={<Volume2 className="h-7 w-7" />}
            title="Произношение"
            subtitle="Sprachausgabe"
            description="Höre die korrekte Aussprache mit integrierter Text-to-Speech."
            color="bg-gold-50 text-gold-700"
          />
          <FeatureCard
            icon={<Trophy className="h-7 w-7" />}
            title="Постижения"
            subtitle="Gamification"
            description="Bleib motiviert mit Streaks, Achievements und Fortschrittsbalken."
            color="bg-primary-50 text-primary"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-100 py-8 text-center">
        <p className="text-sm text-muted">
          © 2026 Slogovo — Български език за всеки
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group rounded-3xl bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]">
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${color} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="mb-1 font-serif text-lg font-bold text-foreground">{title}</h3>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{subtitle}</p>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
