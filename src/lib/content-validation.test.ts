import { describe, expect, it } from "vitest";
import { validateModules, ContentValidationIssue } from "./content-validation";
import { Exercise, Lesson, ModuleMeta, QuizQuestion } from "@/types";

function makeModule(moduleId: string, lessons: { lessonId: string; title: string; duration?: string }[]): ModuleMeta {
  return {
    moduleId,
    level: "A1",
    title: "Test Module",
    description: "desc",
    order: 1,
    lessons: lessons.map((l) => ({ ...l, duration: l.duration ?? "15 min" })),
  };
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    lessonId: "a1-modul-1-lektion-1",
    moduleId: "a1-modul-1",
    level: "A1",
    title: "Test",
    duration: "15 min",
    introduction: "intro",
    summary: "summary",
    vocabulary: [{ id: "v1", de: "Hallo", bg: "Здравей" }],
    grammar: { title: "G", explanation: "e", examples: [{ bg: "bg", de: "de" }] },
    exercises: [],
    ...overrides,
  };
}

function errors(issues: ContentValidationIssue[]): ContentValidationIssue[] {
  return issues.filter((i) => i.severity === "error");
}

function warnings(issues: ContentValidationIssue[]): ContentValidationIssue[] {
  return issues.filter((i) => i.severity === "warning");
}

describe("validateModules", () => {
  it("passes for minimal valid module and lesson", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson();
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues)).toHaveLength(0);
  });

  it("errors when module meta references missing lesson", () => {
    const moduleMeta = makeModule("a1-modul-1", [
      { lessonId: "a1-modul-1-lektion-1", title: "T" },
      { lessonId: "a1-modul-1-lektion-2", title: "Missing" },
    ]);
    const lesson = makeLesson();
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("missing lesson"))).toBe(true);
  });

  it("errors for duplicate vocabulary ids", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      vocabulary: [
        { id: "v1", de: "Hallo", bg: "Здравей" },
        { id: "v1", de: "Hi", bg: "Хей" },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("duplicate vocabulary id"))).toBe(true);
  });

  it("errors for quiz with out-of-range correctOptionIndex", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [
        {
          id: "ex1",
          type: "quiz",
          title: "Q",
          data: [{ id: "q1", question: "Q?", options: ["a", "b"], correctOptionIndex: 5 }],
        },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("correctOptionIndex is out of range"))).toBe(true);
  });

  it("errors for fill-in missing accepted answers", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [
        {
          id: "ex1",
          type: "fill-in",
          title: "F",
          data: [{ id: "f1", parts: ["a", "____"], answer: "x", answers: [] }],
        },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("accepted answers array is empty"))).toBe(true);
  });

  it("errors when sentence-builder correctOrder uses missing tile", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [
        {
          id: "ex1",
          type: "sentence-builder",
          title: "S",
          data: [{ id: "sb1", words: ["A", "B"], correctOrder: ["A", "B", "C"] }],
        },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("correctOrder contains words not present in words pool"))).toBe(true);
  });

  it("warns for empty bgLatin and missing grammar fields", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      vocabulary: [{ id: "v1", de: "Hallo", bg: "Здравей", bgLatin: "" }],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(warnings(issues).some((i) => i.message.includes("bgLatin is present but empty"))).toBe(true);
  });
});

describe("unsupported exercise type", () => {
  it("flags empty listen exercise data as missing", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [
        {
          id: "ex1",
          type: "listen" as Exercise["type"],
          title: "L",
          data: [{ id: "l1", question: "L?", options: ["a", "b"], correctOptionIndex: 0 } as unknown as QuizQuestion],
        },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(issues.some((i) => i.message.includes("not yet supported"))).toBe(true);
  });
});
