import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Lesson } from "@/types";
import { makeExerciseResult } from "@/test/learning-fixtures";
import { createLessonAttempt } from "@/lib/lesson-attempts";
import { LessonSummary } from "./LessonSummary";

const lesson: Lesson = {
  lessonId: "lesson-1",
  moduleId: "module-1",
  level: "A1",
  title: "Testlektion",
  duration: "15 min",
  introduction: "Intro",
  summary: "Zusammenfassung",
  vocabulary: [
    { id: "v1", bg: "грешка", de: "Fehler" },
    { id: "v2", bg: "успех", de: "Erfolg" },
  ],
  grammar: { title: "Grammatik", explanation: "Erklärung", examples: [] },
  exercises: [],
};

describe("LessonSummary", () => {
  it("renders calculated attempt, skill, vocabulary, and next-action values", () => {
    const initialWrong = makeExerciseResult(["wrong"], {
      exerciseId: "exercise-quiz",
      exerciseType: "quiz",
      vocabularyIds: ["v1"],
    });
    const retryCorrect = makeExerciseResult(["correct"], {
      exerciseId: "exercise-quiz",
      exerciseType: "fill-in",
      attemptNumber: 2,
      productive: true,
      vocabularyIds: ["v1"],
    });
    const firstTryCorrect = makeExerciseResult(["correct"], {
      exerciseId: "exercise-writing",
      exerciseType: "fill-in",
      productive: true,
      vocabularyIds: ["v2"],
    });
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      level: lesson.level,
      results: [initialWrong, retryCorrect, firstTryCorrect],
      totalDurationMs: 42_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 50,
      requiresProductive: true,
    });

    render(
      <LessonSummary
        attempt={attempt}
        lesson={lesson}
        nextLessonId="lesson-2"
        passedPreviously={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Lektion bestanden!")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByText("42s")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("Schreiben · 100%")).toBeTruthy();
    expect(screen.getByText("Auswahl · 0%")).toBeTruthy();
    expect(screen.getByText("грешка (Fehler)")).toBeTruthy();
    expect(screen.getByText("успех (Erfolg)")).toBeTruthy();
    expect(screen.getByText(/Wiederhole die Lektion/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lektion wiederholen" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trotzdem weiter" }).getAttribute("href"))
      .toBe("/kurs/module-1/lesson-2");
  });

  it("renders a failed attempt as a retry rather than success", () => {
    const attempt = createLessonAttempt({
      userId: "u1",
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      level: lesson.level,
      results: [makeExerciseResult(["wrong"], { vocabularyIds: ["v1"] })],
      totalDurationMs: 9_000,
      startedAt: "2026-07-13T10:00:00.000Z",
      completed: true,
      requiredScore: 70,
    });

    render(
      <LessonSummary
        attempt={attempt}
        lesson={lesson}
        nextLessonId="lesson-2"
        passedPreviously={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Noch nicht bestanden")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.getByText(/Wiederhole die Lektion und konzentriere dich/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Nächste Lektion" })).toBeNull();
  });
});
