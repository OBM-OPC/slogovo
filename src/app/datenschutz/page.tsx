import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 prose prose-slate">
      <h1>Datenschutzerklärung</h1>
      <p>Stand: 14. Juli 2026</p>
      <p>Slogovo verarbeitet Kontodaten und Lernfortschritt, um Anmeldung, Synchronisierung, Wiederholungen und persönliche Lernstatistiken bereitzustellen. Verantwortlicher ist Oberbeck Marketing; die vollständigen Anbieter- und Kontaktangaben stehen im Impressum.</p>
      <h2>Verarbeitete Daten</h2>
      <ul>
        <li>E-Mail-Adresse, Profilangaben und technische Sitzungsdaten über Supabase Auth;</li>
        <li>Lernversuche, Antworten, Wiederholungszeitpunkte, Fortschritt und Einstellungen;</li>
        <li>datenminimierte, nicht mit einer Benutzer-ID gespeicherte Betriebs- und Lernereignisse;</li>
        <li>kurzlebige, gehashte Rate-Limit-Schlüssel; keine Passwörter, Reset- oder Provider-Tokens in Anwendungslogs.</li>
      </ul>
      <h2>Zweck, Rechtsgrundlage und Empfänger</h2>
      <p>Die Verarbeitung dient der Vertragserfüllung bzw. Bereitstellung des angeforderten Dienstes, der Kontosicherheit und – soweit erforderlich – berechtigten Sicherheitsinteressen. Auftragsverarbeiter können Supabase (Authentifizierung/Datenbank) und Vercel (Hosting) sein. TTS-Anfragen werden nur nach Nutzeraktion und ohne Kontokennung an den konfigurierten Audioanbieter übertragen.</p>
      <h2>Speicherung und Rechte</h2>
      <p>Kontodaten werden bis zur Löschung des Kontos gespeichert. Sicherheitszähler laufen nach ihrem Zeitfenster aus; Telemetrie benötigt eine vom Verantwortlichen freizugebende Löschfrist. In den Einstellungen können Daten exportiert, Lerndaten gelöscht und das Konto gelöscht werden. Gesetzliche Aufbewahrungspflichten und technisch notwendige, zeitlich begrenzte Backups können einer sofortigen vollständigen Entfernung entgegenstehen.</p>
      <p>Betroffene Personen können Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch verlangen sowie sich bei einer Datenschutzaufsichtsbehörde beschweren.</p>
      <p><Link href="/" className="text-primary underline">Zurück zu Slogovo</Link></p>
    </main>
  );
}
