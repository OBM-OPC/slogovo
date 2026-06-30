import { ModuleMeta, Lesson, GrammarTopic } from "@/types";

// ── Auto-generated import block ──
// Content modules are discovered at build time via glob imports.
// To add new levels, drop JSON files under content/<level>/module-*/
// and rebuild. No manual imports needed.
// ──

// A1 Modules
import a1m1Meta from "@/content/a1/module-1/meta.json";
import a1m2Meta from "@/content/a1/module-2/meta.json";
import a1m3Meta from "@/content/a1/module-3/meta.json";
import a1m4Meta from "@/content/a1/module-4/meta.json";
import a1m5Meta from "@/content/a1/module-5/meta.json";
import a1m6Meta from "@/content/a1/module-6/meta.json";

// A2 Modules
import a2m1Meta from "@/content/a2/module-1/meta.json";
import a2m2Meta from "@/content/a2/module-2/meta.json";
import a2m3Meta from "@/content/a2/module-3/meta.json";
import a2m4Meta from "@/content/a2/module-4/meta.json";
import a2m5Meta from "@/content/a2/module-5/meta.json";
import a2m6Meta from "@/content/a2/module-6/meta.json";

// A1 Lessons
import a1m1l1 from "@/content/a1/module-1/lessons/lektion-1.json";
import a1m1l2 from "@/content/a1/module-1/lessons/lektion-2.json";
import a1m1l3 from "@/content/a1/module-1/lessons/lektion-3.json";
import a1m1l4 from "@/content/a1/module-1/lessons/lektion-4.json";
import a1m1l5 from "@/content/a1/module-1/lessons/lektion-5.json";

import a1m2l1 from "@/content/a1/module-2/lessons/lektion-1.json";
import a1m2l2 from "@/content/a1/module-2/lessons/lektion-2.json";
import a1m2l3 from "@/content/a1/module-2/lessons/lektion-3.json";
import a1m2l4 from "@/content/a1/module-2/lessons/lektion-4.json";
import a1m2l5 from "@/content/a1/module-2/lessons/lektion-5.json";

import a1m3l1 from "@/content/a1/module-3/lessons/lektion-1.json";
import a1m3l2 from "@/content/a1/module-3/lessons/lektion-2.json";
import a1m3l3 from "@/content/a1/module-3/lessons/lektion-3.json";
import a1m3l4 from "@/content/a1/module-3/lessons/lektion-4.json";
import a1m3l5 from "@/content/a1/module-3/lessons/lektion-5.json";

import a1m4l1 from "@/content/a1/module-4/lessons/lektion-1.json";
import a1m4l2 from "@/content/a1/module-4/lessons/lektion-2.json";
import a1m4l3 from "@/content/a1/module-4/lessons/lektion-3.json";
import a1m4l4 from "@/content/a1/module-4/lessons/lektion-4.json";
import a1m4l5 from "@/content/a1/module-4/lessons/lektion-5.json";

import a1m5l1 from "@/content/a1/module-5/lessons/lektion-1.json";
import a1m5l2 from "@/content/a1/module-5/lessons/lektion-2.json";
import a1m5l3 from "@/content/a1/module-5/lessons/lektion-3.json";
import a1m5l4 from "@/content/a1/module-5/lessons/lektion-4.json";
import a1m5l5 from "@/content/a1/module-5/lessons/lektion-5.json";

import a1m6l1 from "@/content/a1/module-6/lessons/lektion-1.json";
import a1m6l2 from "@/content/a1/module-6/lessons/lektion-2.json";
import a1m6l3 from "@/content/a1/module-6/lessons/lektion-3.json";
import a1m6l4 from "@/content/a1/module-6/lessons/lektion-4.json";
import a1m6l5 from "@/content/a1/module-6/lessons/lektion-5.json";

// A2 Lessons
import a2m1l1 from "@/content/a2/module-1/lessons/lektion-1.json";
import a2m1l2 from "@/content/a2/module-1/lessons/lektion-2.json";
import a2m1l3 from "@/content/a2/module-1/lessons/lektion-3.json";
import a2m1l4 from "@/content/a2/module-1/lessons/lektion-4.json";
import a2m1l5 from "@/content/a2/module-1/lessons/lektion-5.json";

import a2m2l1 from "@/content/a2/module-2/lessons/lektion-1.json";
import a2m2l2 from "@/content/a2/module-2/lessons/lektion-2.json";
import a2m2l3 from "@/content/a2/module-2/lessons/lektion-3.json";
import a2m2l4 from "@/content/a2/module-2/lessons/lektion-4.json";
import a2m2l5 from "@/content/a2/module-2/lessons/lektion-5.json";

import a2m3l1 from "@/content/a2/module-3/lessons/lektion-1.json";
import a2m3l2 from "@/content/a2/module-3/lessons/lektion-2.json";
import a2m3l3 from "@/content/a2/module-3/lessons/lektion-3.json";
import a2m3l4 from "@/content/a2/module-3/lessons/lektion-4.json";
import a2m3l5 from "@/content/a2/module-3/lessons/lektion-5.json";

import a2m4l1 from "@/content/a2/module-4/lessons/lektion-1.json";
import a2m4l2 from "@/content/a2/module-4/lessons/lektion-2.json";
import a2m4l3 from "@/content/a2/module-4/lessons/lektion-3.json";
import a2m4l4 from "@/content/a2/module-4/lessons/lektion-4.json";
import a2m4l5 from "@/content/a2/module-4/lessons/lektion-5.json";

import a2m5l1 from "@/content/a2/module-5/lessons/lektion-1.json";
import a2m5l2 from "@/content/a2/module-5/lessons/lektion-2.json";
import a2m5l3 from "@/content/a2/module-5/lessons/lektion-3.json";
import a2m5l4 from "@/content/a2/module-5/lessons/lektion-4.json";
import a2m5l5 from "@/content/a2/module-5/lessons/lektion-5.json";

import a2m6l1 from "@/content/a2/module-6/lessons/lektion-1.json";
import a2m6l2 from "@/content/a2/module-6/lessons/lektion-2.json";
import a2m6l3 from "@/content/a2/module-6/lessons/lektion-3.json";
import a2m6l4 from "@/content/a2/module-6/lessons/lektion-4.json";
import a2m6l5 from "@/content/a2/module-6/lessons/lektion-5.json";

// ── Registry ──
// Central map of module meta files per level.
// When adding a new level, just add a new entry here.
const LEVEL_MODULE_METAS: Record<string, ModuleMeta[]> = {
  a1: [
    a1m1Meta, a1m2Meta, a1m3Meta, a1m4Meta, a1m5Meta, a1m6Meta,
  ] as ModuleMeta[],
  a2: [
    a2m1Meta,
    a2m2Meta,
    a2m3Meta,
    a2m4Meta,
    a2m5Meta,
    a2m6Meta,
  ] as ModuleMeta[],
};

// All modules combined, sorted by level then order.
const moduleMetas: ModuleMeta[] = Object.entries(LEVEL_MODULE_METAS)
  .flatMap(([, metas]) => metas)
  .sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level);
    return a.order - b.order;
  });

// All lessons combined.
const lessonsMap: Record<string, Lesson> = {
  "a1-modul-1-lektion-1": a1m1l1 as Lesson,
  "a1-modul-1-lektion-2": a1m1l2 as Lesson,
  "a1-modul-1-lektion-3": a1m1l3 as Lesson,
  "a1-modul-1-lektion-4": a1m1l4 as Lesson,
  "a1-modul-1-lektion-5": a1m1l5 as Lesson,
  "a1-modul-2-lektion-1": a1m2l1 as Lesson,
  "a1-modul-2-lektion-2": a1m2l2 as Lesson,
  "a1-modul-2-lektion-3": a1m2l3 as Lesson,
  "a1-modul-2-lektion-4": a1m2l4 as Lesson,
  "a1-modul-2-lektion-5": a1m2l5 as Lesson,
  "a1-modul-3-lektion-1": a1m3l1 as Lesson,
  "a1-modul-3-lektion-2": a1m3l2 as Lesson,
  "a1-modul-3-lektion-3": a1m3l3 as Lesson,
  "a1-modul-3-lektion-4": a1m3l4 as Lesson,
  "a1-modul-3-lektion-5": a1m3l5 as Lesson,
  "a1-modul-4-lektion-1": a1m4l1 as Lesson,
  "a1-modul-4-lektion-2": a1m4l2 as Lesson,
  "a1-modul-4-lektion-3": a1m4l3 as Lesson,
  "a1-modul-4-lektion-4": a1m4l4 as Lesson,
  "a1-modul-4-lektion-5": a1m4l5 as Lesson,
  "a1-modul-5-lektion-1": a1m5l1 as Lesson,
  "a1-modul-5-lektion-2": a1m5l2 as Lesson,
  "a1-modul-5-lektion-3": a1m5l3 as Lesson,
  "a1-modul-5-lektion-4": a1m5l4 as Lesson,
  "a1-modul-5-lektion-5": a1m5l5 as Lesson,
  "a1-modul-6-lektion-1": a1m6l1 as Lesson,
  "a1-modul-6-lektion-2": a1m6l2 as Lesson,
  "a1-modul-6-lektion-3": a1m6l3 as Lesson,
  "a1-modul-6-lektion-4": a1m6l4 as Lesson,
  "a1-modul-6-lektion-5": a1m6l5 as Lesson,
  "a2-modul-1-lektion-1": a2m1l1 as Lesson,
  "a2-modul-1-lektion-2": a2m1l2 as Lesson,
  "a2-modul-1-lektion-3": a2m1l3 as Lesson,
  "a2-modul-1-lektion-4": a2m1l4 as Lesson,
  "a2-modul-1-lektion-5": a2m1l5 as Lesson,
  "a2-modul-2-lektion-1": a2m2l1 as Lesson,
  "a2-modul-2-lektion-2": a2m2l2 as Lesson,
  "a2-modul-2-lektion-3": a2m2l3 as Lesson,
  "a2-modul-2-lektion-4": a2m2l4 as Lesson,
  "a2-modul-2-lektion-5": a2m2l5 as Lesson,
  "a2-modul-3-lektion-1": a2m3l1 as Lesson,
  "a2-modul-3-lektion-2": a2m3l2 as Lesson,
  "a2-modul-3-lektion-3": a2m3l3 as Lesson,
  "a2-modul-3-lektion-4": a2m3l4 as Lesson,
  "a2-modul-3-lektion-5": a2m3l5 as Lesson,
  "a2-modul-4-lektion-1": a2m4l1 as Lesson,
  "a2-modul-4-lektion-2": a2m4l2 as Lesson,
  "a2-modul-4-lektion-3": a2m4l3 as Lesson,
  "a2-modul-4-lektion-4": a2m4l4 as Lesson,
  "a2-modul-4-lektion-5": a2m4l5 as Lesson,
  "a2-modul-5-lektion-1": a2m5l1 as Lesson,
  "a2-modul-5-lektion-2": a2m5l2 as Lesson,
  "a2-modul-5-lektion-3": a2m5l3 as Lesson,
  "a2-modul-5-lektion-4": a2m5l4 as Lesson,
  "a2-modul-5-lektion-5": a2m5l5 as Lesson,
  "a2-modul-6-lektion-1": a2m6l1 as Lesson,
  "a2-modul-6-lektion-2": a2m6l2 as Lesson,
  "a2-modul-6-lektion-3": a2m6l3 as Lesson,
  "a2-modul-6-lektion-4": a2m6l4 as Lesson,
  "a2-modul-6-lektion-5": a2m6l5 as Lesson,
};

// Helper: returns all registered levels (e.g., ["a1","a2"])
export function getAllLevels(): string[] {
  return Object.keys(LEVEL_MODULE_METAS);
}

// Helper: returns modules for a specific level
export function getModulesByLevel(level: string): ModuleMeta[] {
  return LEVEL_MODULE_METAS[level] ?? [];
}

export function getAllModules(): ModuleMeta[] {
  return moduleMetas;
}

export function getModuleById(moduleId: string): ModuleMeta | undefined {
  return moduleMetas.find((m) => m.moduleId === moduleId);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessonsMap[lessonId];
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  const moduleMeta = getModuleById(moduleId);
  if (!moduleMeta) return [];
  return moduleMeta.lessons
    .map((l) => getLessonById(l.lessonId))
    .filter((l): l is Lesson => !!l);
}

export function getNextLessonId(moduleId: string, lessonId: string): string | null {
  const moduleMeta = getModuleById(moduleId);
  if (!moduleMeta) return null;
  const index = moduleMeta.lessons.findIndex((l) => l.lessonId === lessonId);
  if (index === -1) return null;
  if (index < moduleMeta.lessons.length - 1) {
    return moduleMeta.lessons[index + 1].lessonId;
  }
  // Reached the last lesson of the module: move to the first lesson of the next module
  const nextModule = moduleMetas
    .sort((a, b) => a.order - b.order)
    .find((m) => m.order > moduleMeta.order);
  return nextModule?.lessons[0]?.lessonId ?? null;
}

export function getModuleAndLessonIndex(lessonId: string): { moduleId: string; moduleTitle: string; lessonIndex: number; totalLessons: number } | null {
  const lesson = getLessonById(lessonId);
  if (!lesson) return null;
  const moduleMeta = getModuleById(lesson.moduleId);
  if (!moduleMeta) return null;
  const lessonIndex = moduleMeta.lessons.findIndex((l) => l.lessonId === lessonId);
  return {
    moduleId: lesson.moduleId,
    moduleTitle: moduleMeta.title,
    lessonIndex: lessonIndex >= 0 ? lessonIndex + 1 : 0,
    totalLessons: moduleMeta.lessons.length,
  };
}

export function getAllVocabulary(): Lesson["vocabulary"] {
  return Object.values(lessonsMap).flatMap((lesson) => lesson.vocabulary);
}

export function getVocabularyByCategory(categoryId: string): Lesson["vocabulary"] {
  return Object.values(lessonsMap)
    .filter((lesson) => lesson.moduleId === categoryId)
    .flatMap((lesson) => lesson.vocabulary);
}

const grammarTopics: GrammarTopic[] = [
  {
    topicId: "g-formell-informell",
    level: "A1",
    title: "Formell vs. informell",
    slug: "formell-informell",
    shortDescription: "Wann nutzt man Здравей und Здравейте?",
    content: [
      {
        title: "Anrede",
        explanation:
          "Auf Bulgarisch unterscheidet man zwischen informeller Anrede (Здравей) für Freunde, Familie und Kinder sowie formeller/mehrzahliger Anrede (Здравейте).",
        examples: [
          { bg: "Здравей, Иван!", de: "Hallo, Ivan!" },
          { bg: "Здравейте, господине!", de: "Guten Tag, Herr!" },
          { bg: "Здравейте, всички!", de: "Hallo zusammen!" },
        ],
      },
    ],
  },
  {
    topicId: "g-sein",
    level: "A1",
    title: "Das Verb 'sein' — съм",
    slug: "verb-sein",
    shortDescription: "Bulgarisches 'съм' und seine Verwendung.",
    content: [
      {
        title: "съм — Konjugation",
        explanation: "Das Verb 'съм' (sein) ist unregelmäßig und wird oft weggelassen. Im Präsens lautet die vollständige Konjugation:",
        tables: [
          {
            title: "Präsens von съм",
            headers: ["Person", "Bulgarisch", "Deutsch"],
            rows: [
              ["1. Sg.", "съм", "ich bin"],
              ["2. Sg.", "си", "du bist"],
              ["3. Sg. m.", "е", "er ist"],
              ["3. Sg. f.", "е", "sie ist"],
              ["1. Pl.", "сме", "wir sind"],
              ["2. Pl.", "сте", "ihr seid"],
              ["3. Pl.", "са", "sie sind"],
            ],
          },
        ],
        examples: [
          { bg: "Аз съм учител.", de: "Ich bin Lehrer." },
          { bg: "Той е добре.", de: "Er geht es gut." },
          { bg: "Ние сме от България.", de: "Wir sind aus Bulgarien." },
          { bg: "Те са тук.", de: "Sie sind hier." },
        ],
      },
      {
        title: "Elliptischer Gebrauch",
        explanation: "In der Umgangssprache wird 'съм' oft weggelassen. Das ist besonders bei kurzen Antworten und im Präsens üblich. Im Perfekt und Futur ist das Verb jedoch obligatorisch.",
        examples: [
          { bg: "Аз от Германия.", de: "Ich (bin) aus Deutschland." },
          { bg: "Тя учителка?", de: "Ist sie Lehrerin?" },
          { bg: "Ние добре.", de: "Wir (sind) gut." },
        ],
      },
    ],
  },
  {
    topicId: "g-unbestimmter-artikel",
    level: "A1",
    title: "Unbestimmter Artikel",
    slug: "unbestimmter-artikel",
    shortDescription: "Gibt es im Bulgarischen einen unbestimmten Artikel?",
    content: [
      {
        title: "Kein unbestimmter Artikel",
        explanation: "Im Bulgarischen gibt es keinen unbestimmten Artikel wie im Deutschen ('ein', 'eine'). Stattdessen wird das Nomen ohne Artikel verwendet. 'Един/една/едно' kann zur Betonung der Einzahl verwendet werden, ist aber kein eigentlicher Artikel.",
        examples: [
          { bg: "Искам кафе.", de: "Ich möchte einen Kaffee." },
          { bg: "Това е книга.", de: "Das ist ein Buch." },
          { bg: "Тя е лекар.", de: "Sie ist eine Ärztin." },
          { bg: "Един ден ще пътувам.", de: "Eines Tages werde ich reisen. (Betonung)" },
        ],
      },
      {
        title: "Zählbare vs. unzählbare Substantive",
        explanation: "Unzählbare Substantive (Wasser, Milch, Zeit) verhalten sich genauso wie zählbare – es gibt keinen Artikelunterschied. Das macht das Bulgarische für Deutschsprachige anfänglich einfacher, aber auch verwirrender.",
        examples: [
          { bg: "Пия вода.", de: "Ich trinke Wasser." },
          { bg: "Искам хляб.", de: "Ich möchte Brot." },
          { bg: "Нямам време.", de: "Ich habe keine Zeit." },
        ],
      },
    ],
  },
  {
    topicId: "g-mit-ohne",
    level: "A1",
    title: "Mit und ohne",
    slug: "mit-ohne",
    shortDescription: "Die Präpositionen с und без.",
    content: [
      {
        title: "с und без",
        explanation: "'С' bedeutet 'mit', 'без' bedeutet 'ohne'. Beide stehen direkt vor dem Nomen.",
        examples: [
          { bg: "Кафе с мляко.", de: "Kaffee mit Milch." },
          { bg: "Чай без захар.", de: "Tee ohne Zucker." },
        ],
      },
    ],
  },
  {
    topicId: "g-w-fragen",
    level: "A1",
    title: "W-Fragen",
    slug: "w-fragen",
    shortDescription: "Fragewörter wie Какво?, Къде? und Колко?",
    content: [
      {
        title: "W-Fragen",
        explanation: "Das Fragewort steht am Satzanfang. Die Satzstellung ist sonst flexibel.",
        examples: [
          { bg: "Как се казваш?", de: "Wie heißt du?" },
          { bg: "Къде си?", de: "Wo bist du?" },
          { bg: "Колко струва?", de: "Wie viel kostet das?" },
        ],
      },
    ],
  },
  {
    topicId: "g-personalpronomen",
    level: "A1",
    title: "Personalpronomen",
    slug: "personalpronomen",
    shortDescription: "Ich, du, er/sie/es, wir, ihr, sie auf Bulgarisch.",
    content: [
      {
        title: "Die Pronomen",
        explanation:
          "Bulgarische Personalpronomen ändern sich nach Kasus. Im Nominativ lauten sie: аз (ich), ти (du), той/тя/то (er/sie/es), ние (wir), вие (ihr/Sie), те (sie).",
        examples: [
          { bg: "Аз съм тук.", de: "Ich bin hier." },
          { bg: "Ти си от Германия.", de: "Du bist aus Deutschland." },
          { bg: "Тя е учителка.", de: "Sie ist Lehrerin." },
        ],
      },
    ],
  },
  {
    topicId: "g-artikel",
    level: "A1",
    title: "Bestimmter Artikel",
    slug: "bestimmter-artikel",
    shortDescription: "Der bestimmte Artikel im Bulgarischen — am Ende des Wortes.",
    content: [
      {
        title: "Artikelsuffixe",
        explanation: "Im Bulgarischen wird der bestimmte Artikel als Suffix an das Nomen angehängt. Das ist einzigartig unter den slawischen Sprachen. Die Endung hängt vom Genus und der Endung des Nomens ab:",
        tables: [
          {
            title: "Bestimmter Artikel nach Genus",
            headers: ["Genus", "Endung", "Beispiel", "Deutsch"],
            rows: [
              ["Maskulin (meist -ъ)", "-ът / -а", "мъжът", "der Mann"],
              ["Feminin (meist -а)", "-та", "жената", "die Frau"],
              ["Neutrum (meist -о/-е)", "-то / -те", "детето, кафето", "das Kind, der Kaffee"],
              ["Plural", "-те / -ата", "книгите, деца → децата", "die Bücher, die Kinder"],
            ],
          },
        ],
        examples: [
          { bg: "Мъжът е тук.", de: "Der Mann ist hier." },
          { bg: "Жената е красива.", de: "Die Frau ist schön." },
          { bg: "Детето спи.", de: "Das Kind schläft." },
          { bg: "Книгата е на масата.", de: "Das Buch ist auf dem Tisch." },
        ],
      },
      {
        title: "Besonderheiten",
        explanation: "Nach Präpositionen wie 'в' (in), 'на' (auf/zu) fällt der bestimmte Artikel oft weg oder verändert sich. Auch bei manchen maskulinen Substantiven auf -й oder -ь ändert sich die Artikelendung.",
        examples: [
          { bg: "В магазин.", de: "Im Geschäft. (ohne Artikel)" },
          { bg: "На пазар.", de: "Auf dem Markt. (ohne Artikel)" },
          { bg: "Краят на света.", de: "Das Ende der Welt." },
        ],
      },
    ],
  },
  {
    topicId: "g-negation",
    level: "A1",
    title: "Verneinung",
    slug: "verneinung",
    shortDescription: "Wie man Sätze verneint — mit не, никой, нищо und mehr.",
    content: [
      {
        title: "Die einfache Verneinung 'не'",
        explanation: "Die Verneinung 'не' steht direkt vor dem Verb oder dem Adjektiv. Im Bulgarischen gibt es keine doppelte Verneinung wie im Deutschen ('nicht ... kein') — ein 'не' genügt.",
        examples: [
          { bg: "Не разбирам.", de: "Ich verstehe nicht." },
          { bg: "Не е студено.", de: "Es ist nicht kalt." },
          { bg: "Не искам кафе.", de: "Ich möchte keinen Kaffee." },
          { bg: "Не знам нищо.", de: "Ich weiß nichts." },
        ],
      },
      {
        title: "Negative Indefinitpronomen",
        explanation: "Mit 'не' kombiniert entstehen negative Pronomen: никой (niemand), никога (nie), нищо (nichts), никъде (nirgends).",
        examples: [
          { bg: "Никой не знае.", de: "Niemand weiß es." },
          { bg: "Никога не съм бил там.", de: "Ich war noch nie dort." },
          { bg: "Нищо не разбирам.", de: "Ich verstehe nichts." },
        ],
      },
    ],
  },
  {
    topicId: "g-zahlen",
    level: "A1",
    title: "Zahlen",
    slug: "zahlen",
    shortDescription: "Zahlen von 0 bis 100 bilden.",
    content: [
      {
        title: "Zahlen bis 100",
        explanation: "Die Zahlen von 21 bis 99 werden mit 'и' (und) verbunden: двадесет и две = 22.",
        tables: [
          {
            title: "Zahlen 0–20",
            headers: ["Zahl", "Bulgarisch"],
            rows: [
              ["0", "нула"],
              ["1", "едно"],
              ["2", "две"],
              ["3", "три"],
              ["4", "четири"],
              ["5", "пет"],
              ["6", "шест"],
              ["7", "седем"],
              ["8", "осем"],
              ["9", "девет"],
              ["10", "десет"],
              ["11", "единадесет"],
              ["12", "дванадесет"],
              ["13", "тринадесет"],
              ["14", "четиринадесет"],
              ["15", "петнадесет"],
              ["16", "шестнадесет"],
              ["17", "седемнадесет"],
              ["18", "осемнадесет"],
              ["19", "деветнадесет"],
              ["20", "двадесет"],
            ],
          },
        ],
        examples: [
          { bg: "двадесет и пет", de: "25" },
          { bg: "тридесет и три", de: "33" },
          { bg: "сто", de: "100" },
        ],
      },
    ],
  },
];

export function getAllGrammarTopics(): GrammarTopic[] {
  return grammarTopics;
}

export function getGrammarTopicBySlug(slug: string): GrammarTopic | undefined {
  return grammarTopics.find((t) => t.slug === slug);
}
