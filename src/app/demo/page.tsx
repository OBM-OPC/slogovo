import Link from "next/link";
import { DemoLesson } from "@/components/demo/DemoLesson";

export default function DemoPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Link href="/" className="text-sm text-primary underline">← Zurück</Link>
      <h1 className="mt-5 text-3xl font-serif font-bold">Mini-Lektion testen</h1>
      <p className="mb-6 mt-2 text-muted">Ohne Konto, ohne dauerhafte Speicherung – mobil, per Maus oder Tastatur.</p>
      <DemoLesson />
    </main>
  );
}
