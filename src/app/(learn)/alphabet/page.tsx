"use client";

import { useState } from "react";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { Button } from "@/components/ui/Button";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/useProgressStore";

const alphabet = [
  { upper: "А", lower: "а", nameBg: "а", pronunciation: "a", example: "азбука", exampleTranslation: "Alphabet" },
  { upper: "Б", lower: "б", nameBg: "бе", pronunciation: "b", example: "банан", exampleTranslation: "Banane" },
  { upper: "В", lower: "в", nameBg: "ве", pronunciation: "w", example: "вода", exampleTranslation: "Wasser" },
  { upper: "Г", lower: "г", nameBg: "ге", pronunciation: "g", example: "градина", exampleTranslation: "Garten" },
  { upper: "Д", lower: "д", nameBg: "де", pronunciation: "d", example: "дом", exampleTranslation: "Haus" },
  { upper: "Е", lower: "е", nameBg: "е", pronunciation: "e", example: "еж", exampleTranslation: "Igel" },
  { upper: "Ж", lower: "ж", nameBg: "же", pronunciation: "sch", example: "жаба", exampleTranslation: "Frosch" },
  { upper: "З", lower: "з", nameBg: "зе", pronunciation: "s", example: "зебра", exampleTranslation: "Zebra" },
  { upper: "И", lower: "и", nameBg: "и", pronunciation: "i", example: "игла", exampleTranslation: "Nadel" },
  { upper: "Й", lower: "й", nameBg: "й", pronunciation: "j", example: "йод", exampleTranslation: "Jod" },
  { upper: "К", lower: "к", nameBg: "ка", pronunciation: "k", example: "котка", exampleTranslation: "Katze" },
  { upper: "Л", lower: "л", nameBg: "ел", pronunciation: "l", example: "лъв", exampleTranslation: "Löwe" },
  { upper: "М", lower: "м", nameBg: "ем", pronunciation: "m", example: "мляко", exampleTranslation: "Milch" },
  { upper: "Н", lower: "н", nameBg: "ен", pronunciation: "n", example: "нощ", exampleTranslation: "Nacht" },
  { upper: "О", lower: "о", nameBg: "о", pronunciation: "o", example: "осмица", exampleTranslation: "Acht" },
  { upper: "П", lower: "п", nameBg: "пе", pronunciation: "p", example: "птица", exampleTranslation: "Vogel" },
  { upper: "Р", lower: "р", nameBg: "ер", pronunciation: "r", example: "риба", exampleTranslation: "Fisch" },
  { upper: "С", lower: "с", nameBg: "ес", pronunciation: "s", example: "слънце", exampleTranslation: "Sonne" },
  { upper: "Т", lower: "т", nameBg: "те", pronunciation: "t", example: "тигър", exampleTranslation: "Tiger" },
  { upper: "У", lower: "у", nameBg: "у", pronunciation: "u", example: "ухо", exampleTranslation: "Ohr" },
  { upper: "Ф", lower: "ф", nameBg: "еф", pronunciation: "f", example: "фенер", exampleTranslation: "Laterne" },
  { upper: "Х", lower: "х", nameBg: "ха", pronunciation: "ch", example: "хляб", exampleTranslation: "Brot" },
  { upper: "Ц", lower: "ц", nameBg: "це", pronunciation: "z", example: "цвете", exampleTranslation: "Blume" },
  { upper: "Ч", lower: "ч", nameBg: "че", pronunciation: "tsch", example: "чаша", exampleTranslation: "Tasse" },
  { upper: "Ш", lower: "ш", nameBg: "ша", pronunciation: "sch", example: "шапка", exampleTranslation: "Mütze" },
  { upper: "Щ", lower: "щ", nameBg: "ща", pronunciation: "scht", example: "щастие", exampleTranslation: "Glück" },
  { upper: "Ъ", lower: "ъ", nameBg: "ер голям", pronunciation: "schwa", example: "ъгъл", exampleTranslation: "Ecke" },
  { upper: "Ь", lower: "ь", nameBg: "ер малък", pronunciation: "weich", example: "пьп", exampleTranslation: "—" },
  { upper: "Ю", lower: "ю", nameBg: "ю", pronunciation: "ju", example: "юг", exampleTranslation: "Süden" },
  { upper: "Я", lower: "я", nameBg: "я", pronunciation: "ja", example: "ябълка", exampleTranslation: "Apfel" },
];

export default function AlphabetPage() {
  const progress = useProgressSafe();
  const [index, setIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [viewed, setViewed] = useState(() => new Set<number>([0]));
  const updateSettings = useProgressStore((state) => state.updateSettings);

  const letter = alphabet[index];

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Kyrillisches Alphabet</h1>
      <p className="mb-6 text-muted">Lerne die 30 Buchstaben des bulgarischen Alphabets.</p>

      <div className="card mb-6 text-center">
        <div className="mb-4 text-8xl font-bold text-primary">
          {letter.upper} {letter.lower}
        </div>
        <p className="mb-2 text-2xl font-medium">{letter.nameBg}</p>
        <p className="mb-4 text-muted">Aussprache: {letter.pronunciation}</p>

        {showDetails && (
          <div className="mb-4 rounded-xl bg-gray-50 p-4 animate-fade-in">
            <p className="text-lg font-medium">{letter.example}</p>
            <p className="text-sm text-muted">{letter.exampleTranslation}</p>
          </div>
        )}

        <div className="mb-4">
          <SpeakButton
            text={letter.example}
            progress={progress}
            variant="inline"
            label="Beispiel anhören"
            size="md"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="text-sm text-primary underline"
          >
            {showDetails ? "Weniger anzeigen" : "Details anzeigen"}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-muted">
          <span>Buchstabe {index + 1} / {alphabet.length}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((index + 1) / alphabet.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {alphabet.map((l, i) => (
          <button
            key={l.upper}
            onClick={() => {
              setIndex(i);
              setViewed((current) => new Set([...current, i]));
              setShowDetails(false);
            }}
            className={cn(
              "min-h-11 rounded-lg py-2 text-lg font-bold",
              i === index ? "bg-primary text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"
            )}
          >
            {l.upper}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          fullWidth
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setShowDetails(false);
          }}
        >
          <ArrowLeft className="h-5 w-5" /> Zurück
        </Button>
        <Button
          fullWidth
          disabled={index === alphabet.length - 1 && viewed.size < alphabet.length && !progress.settings.alphabetCompleted}
          onClick={() => {
            if (index === alphabet.length - 1) {
              void updateSettings({ alphabetCompleted: true });
              return;
            }
            setIndex((i) => {
              const next = Math.min(alphabet.length - 1, i + 1);
              setViewed((current) => new Set([...current, next]));
              return next;
            });
            setShowDetails(false);
          }}
        >
          {index === alphabet.length - 1 ? (progress.settings.alphabetCompleted ? "Gemeistert" : "Alphabet abschließen") : <>Weiter <ArrowRight className="h-5 w-5" /></>}
        </Button>
      </div>
    </main>
  );
}
