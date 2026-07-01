"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import {
  BookOpen,
  Brain,
  Trophy,
  Volume2,
  Sparkles,
  Play,
  Flame,
  LogIn,
  UserPlus,
  ArrowRight,
  Languages,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const progress = useProgressSafe();

  return (
    <div className="min-h-screen bg-rose-pattern">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-warm-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-primary">Slogovo</span>
            <span className="hidden sm:inline h-4 w-px bg-warm-200" />
            <span className="hidden sm:inline text-xs text-muted cyrillic">
              Български език
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && !isAuthenticated ? (
              <>
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
              </>
            ) : !isLoading && isAuthenticated && user ? (
              <Link
                href="/lernen"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
              >
                <Flame className="h-3.5 w-3.5" />
                Weiterlernen
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Български за начинающих
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            Lerne{" "}
            <span className="text-primary">Bulgarisch</span>
            {" "}mit Slogovo
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-sm mx-auto mb-8 leading-relaxed">
            Die interaktive App für Anfänger. Vom kyrillischen Alphabet bis zum ersten Gespräch.
          </p>

          {!isLoading && isAuthenticated && user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* User Welcome */}
              <div className="rounded-2xl bg-white p-5 shadow-card text-left">
                <p className="text-sm text-muted mb-1">Willkommen zurück, {user.displayName || user.name || user.email}</p>
                <div className="grid grid-cols-3 gap-3">
                  <StatItem
                    icon={<Flame className="h-4 w-4 text-accent" />}
                    value={progress.streak.current}
                    label="Streak"
                  />
                  <StatItem
                    icon={<BookOpen className="h-4 w-4 text-primary" />}
                    value={progress.completedLessons.length}
                    label="Lektionen"
                  />
                  <StatItem
                    icon={<Target className="h-4 w-4 text-gold-600" />}
                    value={progress.exerciseStats.total}
                    label="Übungen"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/lernen"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-white shadow-card active:scale-[0.98] transition-all"
                >
                  <Play className="h-5 w-5" />
                  Jetzt lernen
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/fortschritt"
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-warm-200 bg-white px-6 py-3.5 text-base font-medium text-foreground shadow-card active:scale-[0.98] transition-all"
                >
                  Mein Fortschritt
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-white shadow-card active:scale-[0.98] transition-all"
              >
                <UserPlus className="h-5 w-5" />
                Kostenlos starten
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-warm-200 bg-white px-6 py-3.5 text-base font-medium text-foreground shadow-card active:scale-[0.98] transition-all"
              >
                <LogIn className="h-5 w-5" />
                Anmelden
              </Link>
            </div>
          )}
        </motion.div>

        {/* Features */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-6">
            Was Slogovo bietet
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Курс"
              subtitle="Strukturiert"
              description="A1–A2 Schritt für Schritt"
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
        </section>

        {/* How It Works */}
        {!isAuthenticated && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-6">
              So funktioniert&apos;s
            </h2>
            <div className="space-y-4">
              <StepItem
                number="1"
                title="Lektion wählen"
                description="Wähle aus strukturierten A1- und A2-Lektionen."
                icon={<BookOpen className="h-5 w-5 text-primary" />}
              />
              <StepItem
                number="2"
                title="Lernen & Üben"
                description="Vokabeln, Grammatik und interaktive Übungen."
                icon={<Brain className="h-5 w-5 text-accent" />}
              />
              <StepItem
                number="3"
                title="Fortschritt messen"
                description="Verfolge deinen Lernfortschritt und deine Streaks."
                icon={<Trophy className="h-5 w-5 text-gold-600" />}
              />
            </div>
          </section>
        )}

        {/* Quick Actions for logged in */}
        {isAuthenticated && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-6">
              Schnellzugriff
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction href="/kurs" icon={<BookOpen className="h-5 w-5" />} label="Kurs" />
              <QuickAction href="/vokabeln" icon={<Languages className="h-5 w-5" />} label="Vokabeln" />
              <QuickAction href="/grammatik" icon={<Target className="h-5 w-5" />} label="Grammatik" />
              <QuickAction href="/fortschritt" icon={<Trophy className="h-5 w-5" />} label="Fortschritt" />
            </div>
          </section>
        )}

        {/* CTA Section for logged out */}
        {!isAuthenticated && (
          <section className="mb-12 sm:mb-16 rounded-3xl bg-primary p-6 text-center text-white shadow-card">
            <h2 className="text-xl font-serif font-bold mb-2">
              Bereit für dein Bulgarisch-Abenteuer?
            </h2>
            <p className="text-sm text-white/80 mb-4">
              Melde dich kostenlos an und starte deine erste Lektion.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-medium text-primary shadow-card active:scale-[0.98] transition-all"
            >
              <UserPlus className="h-5 w-5" />
              Kostenlos starten
            </Link>
          </section>
        )}
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

/* ── Sub-components ── */

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-warm-50 p-2">
      {icon}
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted">{label}</span>
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
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <h3 className="mb-0.5 font-serif text-sm font-bold text-foreground">
        {title}
      </h3>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
        {subtitle}
      </p>
      <p className="text-xs text-muted leading-snug">{description}</p>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="font-medium text-sm text-foreground">{title}</h3>
        </div>
        <p className="text-xs text-muted leading-snug">{description}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card active:scale-[0.98] transition-all hover:shadow-card-hover"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted" />
    </Link>
  );
}
