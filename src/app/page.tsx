import Link from "next/link";
import { BookOpen, Brain, Trophy, Volume2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-rose-pattern">
      {/* Navigation — mobile optimized */}
      <nav className="sticky top-0 z-50 border-b border-warm-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-primary">Slogovo</span>
            <span className="hidden sm:inline h-4 w-px bg-warm-200" />
            <span className="hidden sm:inline text-xs text-muted cyrillic">Български език</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-warm-50 transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
            >
              Starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — mobile first */}
      <main className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Български за начинаещи
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            Lerne{" "}
            <span className="text-primary">Bulgarisch</span>
            {" "}mit Slogovo
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-sm mx-auto mb-8 leading-relaxed">
            Die interaktive App für Anfänger. Vom kyrillischen Alphabet bis zum ersten Gespräch.
          </p>
          <div className="flex flex-col gap-3 px-4">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-white shadow-card active:scale-[0.98] transition-all"
            >
              Kostenlos starten
              <span className="text-white/50">→</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-warm-200 bg-white px-6 py-3.5 text-base font-medium text-foreground shadow-card active:scale-[0.98] transition-all"
            >
              Anmelden
            </Link>
          </div>
        </div>

        {/* Features — 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Курс"
            subtitle="Strukturiert"
            description="A1 bis C1 Schritt für Schritt"
            color="bg-primary-50 text-primary"
          />
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="Речник"
            subtitle="Vokabeln"
            description="Karteikarten & Repetition"
            color="bg-accent-50 text-accent"
          />
          <FeatureCard
            icon={<Volume2 className="h-5 w-5" />}
            title="Звук"
            subtitle="Aussprache"
            description="Text-to-Speech integriert"
            color="bg-gold-50 text-gold-700"
          />
          <FeatureCard
            icon={<Trophy className="h-5 w-5" />}
            title="Игри"
            subtitle="Gamification"
            description="Streaks & Achievements"
            color="bg-primary-50 text-primary"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-100 py-6 text-center">
        <p className="text-xs text-muted">
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
    <div className="group rounded-2xl bg-white p-4 shadow-card transition-all duration-200 active:scale-[0.98]">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="mb-0.5 font-serif text-sm font-bold text-foreground">{title}</h3>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">{subtitle}</p>
      <p className="text-xs text-muted leading-snug">{description}</p>
    </div>
  );
}
