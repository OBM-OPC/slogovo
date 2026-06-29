import Link from "next/link";
import { BookOpen, Brain, Trophy, Volume2 } from "lucide-react";

export default function HomePage() {
  return (
    <div class之前就in-h-screen bg-gradient-to-br from-[#009B77]/5 to-[#D62612]/5">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#009B77]">Slogovo</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Български език</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#009B77] transition-colors"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#009B77] hover:bg-[#007A5F] text-white rounded-lg transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Lerne <span className="text-[#009B77]">Bulgarisch</span>
            <br />
            mit Slogovo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Die interaktive App für deutschsprachige Anfänger. Beginne mit dem kyrillischen Alphabet 
            und arbeite dich bis zu deinem ersten Gespräch durch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#009B77] hover:bg-[#007A5F] text-white text-lg font-semibold rounded-xl transition-colors"
            >
              Kostenlos starten
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-[#009B77] text-[#009B77] hover:bg-[#009B77]/5 text-lg font-semibold rounded-xl transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Strukturierter Kurs"
            description="Von A1 bis C1 - lerne Schritt für Schritt mit unserem Lektionssystem."
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="Vokabeltrainer"
            description="Effektives Lernen mit Karteikarten und Spaced Repetition."
          />
          <FeatureCard
            icon={<Volume2 className="w-8 h-8" />}
            title="Sprachausgabe"
            description="Höre die korrekte Aussprache mit integrierter Text-to-Speech."
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Gamification"
            description="Bleib motiviert mit Streaks, Achievements und Fortschrittsbalken."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-[#009B77]/30 transition-colors">
      <div className="w-14 h-14 bg-[#009B77]/10 rounded-xl flex items-center justify-center text-[#009B77] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}
