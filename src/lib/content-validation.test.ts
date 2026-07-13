import { describe, expect, it } from "vitest";
import { validateGrammarTopics, validateModules, ContentValidationIssue } from "./content-validation";
import { Exercise, GrammarTopic, Lesson, ModuleMeta } from "@/types";

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
    vocabulary: [{ id: "v1", de: "Hallo", bg: "Здравей", bgLatin: "Sdrawej" }],
    grammar: { title: "G", explanation: "e", examples: [{ bg: "bg", de: "de" }] },
    exercises: [],
    ...overrides,
  };
}

function errors(issues: ContentValidationIssue[]): ContentValidationIssue[] {
  return issues.filter((i) => i.severity === "error");
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

  it("rejects missing A1 transliteration", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      vocabulary: [{ id: "v1", de: "Hallo", bg: "Здравей", bgLatin: "" }],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues).some((i) => i.message.includes("A1 vocabulary requires"))).toBe(true);
  });

  it("rejects unresolved native-review markers", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      vocabulary: [{
        id: "v1",
        de: "Hallo",
        bg: "Здравей",
        bgLatin: "NATIVE_REVIEW_NEEDED",
        needsNativeReview: true,
      }],
    });
    const messages = errors(validateModules([moduleMeta], [lesson])).map((issue) => issue.message);

    expect(messages.some((message) => message.includes("needs native-speaker review"))).toBe(true);
    expect(messages.some((message) => message.includes("NATIVE_REVIEW_NEEDED marker"))).toBe(true);
  });

  it("rejects incomplete lesson narrative and grammar", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      introduction: "",
      summary: "",
      grammar: { title: "", explanation: "", examples: [] },
    });
    const messages = errors(validateModules([moduleMeta], [lesson])).map((issue) => issue.message);

    expect(messages).toEqual(expect.arrayContaining([
      "introduction is missing",
      "summary is missing",
      "grammar title is missing",
      "grammar explanation is missing",
      "grammar examples are missing or empty",
    ]));
  });

  it("accepts a valid required exercise group", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [{
        id: "ex1",
        type: "quiz",
        title: "Q",
        data: [{ id: "q1", question: "Q?", options: ["a", "b"], correctOptionIndex: 0 }],
      }],
      requiredExerciseGroups: [{ id: "core", exerciseIds: ["ex1"] }],
    });

    expect(errors(validateModules([moduleMeta], [lesson]))).toHaveLength(0);
  });

  it("rejects unknown exercises and impossible required group minimums", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [{
        id: "ex1",
        type: "quiz",
        title: "Q",
        data: [{ id: "q1", question: "Q?", options: ["a", "b"], correctOptionIndex: 0 }],
      }],
      requiredExerciseGroups: [{
        id: "core",
        exerciseIds: ["ex1", "missing"],
        minimumPassed: 3,
      }],
    });
    const messages = errors(validateModules([moduleMeta], [lesson])).map((issue) => issue.message);

    expect(messages.some((message) => message.includes("unknown exercise 'missing'"))).toBe(true);
    expect(messages.some((message) => message.includes("minimumPassed"))).toBe(true);
  });

  it("rejects missing, duplicate, and internally duplicated group identifiers", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [{
        id: "ex1",
        type: "quiz",
        title: "Q",
        data: [{ id: "q1", question: "Q?", options: ["a", "b"], correctOptionIndex: 0 }],
      }],
      requiredExerciseGroups: [
        { id: "", exerciseIds: [] },
        { id: "core", exerciseIds: ["ex1", "ex1"] },
        { id: "core", exerciseIds: ["ex1"] },
      ],
    });
    const messages = errors(validateModules([moduleMeta], [lesson])).map((issue) => issue.message);

    expect(messages.some((message) => message.includes("group id is missing"))).toBe(true);
    expect(messages.some((message) => message.includes("duplicate required exercise group id"))).toBe(true);
    expect(messages.some((message) => message.includes("duplicate exercise ids"))).toBe(true);
  });

  it("rejects a required group that only references optional items", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [{
        id: "optional-exercise",
        type: "quiz",
        title: "Q",
        data: [{
          id: "q1",
          question: "Q?",
          options: ["a", "b"],
          correctOptionIndex: 0,
          required: false,
        }],
      }],
      requiredExerciseGroups: [{ id: "core", exerciseIds: ["optional-exercise"] }],
    });
    const messages = errors(validateModules([moduleMeta], [lesson])).map((issue) => issue.message);

    expect(messages.some((message) => message.includes("without required items"))).toBe(true);
  });
});

describe("validateGrammarTopics", () => {
  function makeTopic(overrides: Partial<GrammarTopic> = {}): GrammarTopic {
    return {
      topicId: "topic-1",
      level: "A1",
      title: "Grammar",
      slug: "grammar",
      shortDescription: "Description",
      content: [{
        title: "Section",
        explanation: "Explanation",
        examples: [{ bg: "Аз съм тук.", de: "Ich bin hier." }],
      }],
      ...overrides,
    };
  }

  it("accepts complete registered grammar topics", () => {
    expect(validateGrammarTopics([makeTopic()])).toEqual([]);
  });

  it("rejects duplicate identifiers and incomplete sections", () => {
    const issues = validateGrammarTopics([
      makeTopic({ content: [{ title: "", explanation: "", examples: [] }] }),
      makeTopic(),
    ]);
    const messages = errors(issues).map((issue) => issue.message);

    expect(messages).toEqual(expect.arrayContaining([
      "grammar title is missing",
      "grammar explanation is missing",
      "grammar examples are missing or empty",
      "duplicate grammar topic id 'topic-1'",
      "duplicate grammar topic slug 'grammar'",
    ]));
  });
});

describe("listen exercise validation", () => {
  it("accepts a fully renderable listen exercise", () => {
    const moduleMeta = makeModule("a1-modul-1", [{ lessonId: "a1-modul-1-lektion-1", title: "T" }]);
    const lesson = makeLesson({
      exercises: [
        {
          id: "ex1",
          type: "listen" as Exercise["type"],
          title: "L",
          data: [{
            id: "l1",
            format: "audio-comprehension",
            audioText: "Как си?",
            question: "L?",
            options: ["a", "b"],
            correctOptionIndex: 0,
          }],
        },
      ],
    });
    const issues = validateModules([moduleMeta], [lesson]);
    expect(errors(issues)).toHaveLength(0);
  });
});
