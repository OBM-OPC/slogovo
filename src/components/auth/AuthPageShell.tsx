import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ShieldCheck } from "lucide-react";

export function AuthPageShell({ children, mode }: { children: React.ReactNode; mode: "login" | "register" }) {
  return (
    <main className="min-h-screen bg-rose-pattern px-3 py-5 safe-top safe-bottom sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary-50"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Zur Startseite</Link>
        <div className="mt-4 grid items-center gap-8 lg:grid-cols-[1fr_28rem] lg:gap-16">
          <section className="hidden lg:block" aria-label="Slogovo Vorteile">
            <Link href="/" className="inline-flex items-center gap-3 text-primary"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary font-bold text-white">С</span><span className="font-serif text-3xl font-bold">Slogovo</span></Link>
            <h1 className="mt-8 text-balance text-4xl font-bold leading-tight">{mode === "login" ? "Dein Lernweg wartet auf dich." : "Dein Bulgarisch beginnt mit einem klaren nächsten Schritt."}</h1>
            <p className="mt-4 max-w-lg text-lg leading-8 text-warm-700">Kurze Lerneinheiten, gezielte Wiederholungen und echte Fortschrittswerte – ohne Werbung oder künstliche Erfolgszahlen.</p>
            <ul className="mt-8 space-y-4 text-sm text-warm-700">
              <li className="flex items-center gap-3"><BookOpenCheck className="h-5 w-5 text-primary" aria-hidden="true" /> 60 strukturierte Lektionen von A1 bis A2</li>
              <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /> Datenschutzbewusste Lern- und Kontofunktionen</li>
            </ul>
          </section>
          <div>
            <div className="mb-6 text-center lg:hidden"><Link href="/" className="inline-flex items-center gap-2 text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">С</span><span className="font-serif text-2xl font-bold">Slogovo</span></Link><p className="mt-2 text-sm text-muted" lang="bg">Български език</p></div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
