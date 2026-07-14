import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Clock3,
  Headphones,
  HeartHandshake,
  LockKeyhole,
  MessageCircleMore,
  Plane,
  Play,
  Sparkles,
  UsersRound,
  Volume2,
} from "lucide-react";
import { BEGINNER_LABEL_BG } from "@/lib/content-copy";

const benefits = [
  {
    icon: MessageCircleMore,
    title: "Sprich vom ersten Tag an",
    description: "Übe kurze, alltagstaugliche Dialoge statt isolierter Regeln.",
  },
  {
    icon: Headphones,
    title: "Hör Bulgarisch in deinem Tempo",
    description: "Spiele Wörter und Sätze normal oder langsam ab und wiederhole sie jederzeit.",
  },
  {
    icon: BookOpenCheck,
    title: "Behalte, was du lernst",
    description: "Fällige Wörter und Fehler kommen genau dann zurück, wenn Übung sinnvoll ist.",
  },
];

const audiences = [
  [Plane, "Reise & Erasmus", "Sicher begrüßen, bestellen und nach dem Weg fragen."],
  [UsersRound, "Familie & Alltag", "Gespräche besser verstehen und selbstbewusst antworten."],
  [HeartHandshake, "Leben & Arbeit", "Schrittweise Wortschatz für Ankommen, Termine und Beruf aufbauen."],
] as const;

const faqs = [
  ["Brauche ich Vorkenntnisse?", "Nein. Der A1-Pfad beginnt beim kyrillischen Alphabet und führt dich in kleinen Schritten zu ersten Gesprächen."],
  ["Wie viel Zeit brauche ich?", "Eine Lerneinheit dauert meist 5–10 Minuten. Slogovo plant Wiederholungen passend zu deinem Tagesziel."],
  ["Kann ich Slogovo zuerst testen?", "Ja. Die Demo funktioniert ohne Konto und speichert keine persönlichen Daten oder Lernfortschritte."],
  ["Lerne ich auch die Aussprache?", "Ja. Du kannst bulgarische Wörter und Sätze anhören, verlangsamen und deine eigene Aussprache lokal aufnehmen und vergleichen."],
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-rose-pattern">
      <header className="sticky top-0 z-50 border-b border-warm-200/70 bg-background/90 backdrop-blur-xl">
        <nav aria-label="Seitennavigation" className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white" aria-hidden="true">С</span>
            <span className="font-serif text-xl font-bold">Slogovo</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/demo" className="hidden min-h-11 items-center px-2 text-sm font-semibold text-primary hover:text-primary-700 sm:inline-flex">Demo testen</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-foreground underline-offset-4 hover:underline">Anmelden</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_20%_20%,rgba(45,106,79,0.12),transparent_38%),radial-gradient(circle_at_85%_25%,rgba(212,165,116,0.16),transparent_34%)]" aria-hidden="true" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:py-24">
            <div className="text-center lg:text-left">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-primary shadow-card">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span lang="bg">{BEGINNER_LABEL_BG}</span>
              </p>
              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
                Bulgarisch, das du im Alltag wirklich sprichst.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-8 text-warm-700 lg:mx-0">
                Lerne kyrillisch lesen, verstehe natürliche Aussprache und führe deine ersten Gespräche – mit einem klaren Lernweg für deutschsprachige Anfänger.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/register" className="btn-primary min-h-14 w-full px-7 text-base sm:w-auto">
                  Kostenlos starten <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 px-3 font-semibold text-primary underline-offset-4 hover:underline">
                  <Play className="h-4 w-4" aria-hidden="true" /> Ohne Konto ausprobieren
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-warm-700 lg:justify-start">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" aria-hidden="true" /> 5–10 Minuten pro Lektion</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" aria-hidden="true" /> Kostenlos starten</span>
                <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-4 w-4 text-primary" aria-hidden="true" /> Datenschutzbewusst</span>
              </div>
            </div>

            <LearningInterfacePreview />
          </div>
        </section>

        <section aria-label="Vertrauensmerkmale" className="border-y border-warm-200/70 bg-white/70">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-6 text-center sm:grid-cols-4 sm:px-6">
            <TrustMetric value="60" label="strukturierte Lektionen" />
            <TrustMetric value="A1–A2" label="klarer Lernpfad" />
            <TrustMetric value="0 €" label="zum Ausprobieren" />
            <TrustMetric value="Ohne Werbung" label="konzentriert lernen" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="benefits-heading">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Lernen mit Richtung</p>
            <h2 id="benefits-heading" className="mt-3 text-balance text-3xl font-bold sm:text-4xl">Jede Einheit bringt dich näher zum nächsten echten Gespräch.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl border border-warm-200/80 bg-white p-6 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-warm-700">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-primary-900 py-16 text-white sm:py-24" aria-labelledby="audience-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-200">Für deinen Grund</p>
              <h2 id="audience-heading" className="mt-3 text-3xl font-bold sm:text-4xl">Bulgarisch lernen, weil dein Leben dich dorthin führt.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {audiences.map(([Icon, title, description]) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <Icon className="h-7 w-7 text-gold-300" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-7 text-white/75">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="voices-heading">
          <div className="rounded-[2rem] border border-warm-200 bg-white p-7 shadow-card sm:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Stimmen aus der Testphase</p>
                <h2 id="voices-heading" className="mt-3 text-3xl font-bold">Vertrauen entsteht durch echte Erfahrungen.</h2>
                <p className="mt-4 max-w-2xl leading-7 text-warm-700">Slogovo wird aktuell mit Lernenden erprobt. Verifizierte Erfahrungsberichte erscheinen hier erst nach ihrer ausdrücklichen Freigabe – keine erfundenen Zitate.</p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold-50 text-gold-700" aria-hidden="true"><UsersRound className="h-10 w-10" /></div>
            </div>
          </div>
        </section>

        <section className="border-y border-warm-200/70 bg-white/70 py-16 sm:py-24" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-primary">Kurz erklärt</p>
            <h2 id="faq-heading" className="mt-3 text-center text-3xl font-bold sm:text-4xl">Häufige Fragen</h2>
            <div className="mt-8 divide-y divide-warm-200 overflow-hidden rounded-3xl border border-warm-200 bg-white">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group p-5 open:bg-warm-50 sm:p-6">
                  <summary className="cursor-pointer list-none pr-8 font-bold marker:hidden focus-visible:rounded-lg">{question}<span className="float-right text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary>
                  <p className="mt-3 max-w-2xl leading-7 text-warm-700">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="rounded-[2rem] bg-primary px-6 py-12 text-white shadow-card sm:px-12">
            <h2 className="text-balance text-3xl font-bold sm:text-4xl">Dein erstes bulgarisches Gespräch beginnt heute.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">Starte kostenlos und finde in wenigen Fragen den Lernweg, der zu deinem Alltag passt.</p>
            <Link href="/register" className="mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 font-bold text-primary shadow-card hover:bg-warm-50">Kostenlos starten <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-warm-200 bg-primary-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:px-6">
          <div>
            <p className="font-serif text-xl font-bold">Slogovo</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/65">Ein klarer, werbefreier Lernweg für Bulgarisch – mit echten Lernmetriken statt künstlichem Fortschritt.</p>
          </div>
          <nav aria-label="Rechtliches" className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm">
            <Link href="/demo" className="min-h-11 py-2 text-white/75 hover:text-white">Demo</Link>
            <Link href="/datenschutz" className="min-h-11 py-2 text-white/75 hover:text-white">Datenschutz</Link>
            <Link href="/impressum" className="min-h-11 py-2 text-white/75 hover:text-white">Impressum</Link>
          </nav>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/55">© 2026 Slogovo · <span lang="bg">Български език за всеки</span></div>
      </footer>
    </div>
  );
}

function LearningInterfacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label="Vorschau der Slogovo-Lernoberfläche">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl" aria-hidden="true" />
      <div className="overflow-hidden rounded-[2rem] border border-warm-200 bg-white shadow-[0_24px_70px_rgba(30,26,22,0.14)]">
        <div className="flex items-center justify-between border-b border-warm-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Lektion 3 · Begrüßung</p>
            <p className="mt-1 text-sm font-semibold">Frage 4 von 8</p>
          </div>
          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800">ca. 4 Min.</span>
        </div>
        <div className="h-1.5 bg-warm-100"><div className="h-full w-1/2 bg-primary" /></div>
        <div className="p-5 sm:p-7">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Volume2 className="h-6 w-6" aria-hidden="true" /></span>
          <p className="mt-5 text-sm text-muted">Wie sagst du „Guten Tag“?</p>
          <p className="mt-2 text-3xl font-bold" lang="bg">Добър ден</p>
          <p className="mt-1 text-sm text-muted">Dobăr den</p>
          <div className="mt-6 grid gap-3">
            <div className="flex min-h-14 items-center rounded-2xl border-2 border-primary bg-primary-50 px-4 font-semibold text-primary"><Check className="mr-3 h-5 w-5" aria-hidden="true" /> Guten Tag</div>
            <div className="flex min-h-14 items-center rounded-2xl border border-warm-200 px-4 text-warm-700">Gute Nacht</div>
            <div className="flex min-h-14 items-center rounded-2xl border border-warm-200 px-4 text-warm-700">Vielen Dank</div>
          </div>
          <div className="mt-5 rounded-2xl bg-primary-50 p-4 text-sm leading-6 text-primary-800"><strong>Richtig.</strong> Diese höfliche Begrüßung passt tagsüber in fast jeder Situation.</div>
        </div>
      </div>
      <Link href="/demo" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-white font-semibold text-primary shadow-card hover:bg-primary-50"><Play className="h-4 w-4" aria-hidden="true" /> Interaktive Demo öffnen</Link>
    </div>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return <div className="px-2 py-3"><p className="text-xl font-bold text-primary sm:text-2xl">{value}</p><p className="mt-1 text-xs text-warm-700 sm:text-sm">{label}</p></div>;
}
