import Link from "next/link";

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 prose prose-slate">
      <h1>Impressum</h1>
      <p><strong>Diensteanbieter:</strong> Oberbeck Marketing</p>
      <p>Die ladungsfähige Anschrift, Vertretungsangaben, Kontaktadresse und – soweit anwendbar – Register- und Umsatzsteuerangaben müssen vom Betreiber vor dem öffentlichen Produktivbetrieb ergänzt und rechtlich geprüft werden.</p>
      <h2>Verantwortung für Inhalte</h2>
      <p>Die Lerninhalte dienen der Sprachvermittlung. Trotz sorgfältiger Prüfung können Fehler nicht vollständig ausgeschlossen werden. Hinweise können über die vom Betreiber veröffentlichte Kontaktadresse gemeldet werden.</p>
      <p><Link href="/datenschutz" className="text-primary underline">Datenschutz</Link> · <Link href="/" className="text-primary underline">Zurück zu Slogovo</Link></p>
    </main>
  );
}
