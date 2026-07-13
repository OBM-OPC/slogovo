import { describe, expect, it } from "vitest";
import type { Lesson, ModuleMeta } from "@/types";
import { buildContentQualityReport, renderContentQualityReport } from "./content-quality";

const moduleMeta: ModuleMeta = {
  moduleId: "a1-modul-1",
  level: "A1",
  title: "Test module",
  description: "Description",
  order: 1,
  lessons: [{ lessonId: "a1-modul-1-lektion-1", title: "Test lesson", duration: "5 min" }],
};

function lesson(): Lesson {
  return {
    lessonId: "a1-modul-1-lektion-1",
    moduleId: "a1-modul-1",
    level: "A1",
    title: "Test lesson",
    duration: "5 min",
    introduction: "Introduction",
    summary: "Summary",
    vocabulary: [
      { id: "tested", de: "Hallo", bg: "Здравей", audio: "/audio/hello.mp3" },
      { id: "untested", de: "Danke", bg: "Благодаря" },
      { id: "untested", de: "Vielen Dank", bg: "Много благодаря" },
    ],
    grammar: { title: "Grammar", explanation: "", examples: [] },
    exercises: [
      {
        id: "quiz-1",
        type: "quiz",
        title: "Quiz",
        data: [{ id: "q1", question: "Was bedeutet Здравей?", options: ["Здравей", "Чао"], correctOptionIndex: 0 }],
      },
      {
        id: "broken-fill",
        type: "fill-in",
        title: "Fill",
        data: [{ id: "f1", parts: ["", "____"], answer: "", answers: [] }],
      },
      {
        id: "future-1",
        type: "future" as never,
        title: "Future",
        data: [{ id: "x1" }] as never,
      },
    ],
  };
}

describe("course content quality report", () => {
  it("counts inventory and identifies every required quality-gap category", () => {
    const first = lesson();
    const second = { ...lesson(), lessonId: "a1-modul-1-lektion-2", exercises: first.exercises.slice(0, 1) };
    const report = buildContentQualityReport([moduleMeta], [first, second]);

    expect(report.totals).toEqual({ modules: 1, lessons: 2, vocabularyItems: 6, exerciseItems: 4 });
    expect(report.affected.untestedVocabulary).toBe(4);
    expect(report.affected.missingAudio).toBe(4);
    expect(report.affected.missingAcceptedAnswers).toBe(1);
    expect(report.affected.unsupportedExerciseTypes).toBe(1);
    expect(report.affected.duplicateIds).toBeGreaterThanOrEqual(3);
    expect(report.affected.missingGrammarExplanations).toBe(2);
    expect(report.affected.lessonsWithoutProductiveExercises).toBe(1);
  });

  it("renders an author-readable inventory and file-based findings", () => {
    const text = renderContentQualityReport(buildContentQualityReport([moduleMeta], [lesson()]));

    expect(text).toContain("Inventory: 1 modules | 1 lessons | 3 vocabulary items | 3 exercise items");
    expect(text).toContain("Untested vocabulary: 2");
    expect(text).toContain("content/a1/module-1/lessons/lektion-1.json");
    expect(text).toContain("unsupported exercise type 'future'");
  });
});
