import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lesson } from "@/types";
import { LessonView } from "./LessonView";

const recordLessonAttempt = vi.fn();

vi.mock("@/hooks/useProgressSafe", () => ({
  useProgressSafe: () => ({
    userId: "user-1",
    completedLessons: [],
    settings: { showLatin: false, ttsEnabled: false, speechRate: 1, dailyGoal: "medium" },
  }),
}));

vi.mock("@/stores/useProgressStore", () => ({
  useProgressStore: (selector: (state: { recordLessonAttempt: typeof recordLessonAttempt }) => unknown) =>
    selector({ recordLessonAttempt }),
}));

const lesson: Lesson = {
  lessonId: "retry-lesson",
  moduleId: "a1-modul-1",
  level: "A1",
  title: "Retry-Test",
  duration: "5 min",
  introduction: "Intro",
  summary: "Summary",
  vocabulary: [],
  grammar: { title: "Grammar", explanation: "Explanation", examples: [] },
  exercises: [{
    id: "quiz-retry",
    type: "quiz",
    title: "Quiz",
    data: [{
      id: "required-question",
      question: "Welche Antwort?",
      options: ["Richtig", "Falsch"],
      correctOptionIndex: 0,
      required: true,
    }],
  }],
};

describe("LessonView retry flow", () => {
  beforeEach(() => recordLessonAttempt.mockReset());

  it("moves failed required items into a different retry format", () => {
    render(
      <LessonView
        lesson={lesson}
        moduleId={lesson.moduleId}
        nextLessonId={null}
        context={{ moduleId: lesson.moduleId, moduleTitle: "Module", lessonIndex: 1, totalLessons: 1 }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Los geht's" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter zur Grammatik" }));
    fireEvent.click(screen.getByRole("button", { name: "Übungen starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Falsch" }));
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));

    expect(screen.getByText("Fehler wiederholen")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Wiederholung starten" }));
    expect(screen.getByPlaceholderText("Antwort eingeben")).toBeTruthy();
    expect(screen.getByText("Welche Antwort?")).toBeTruthy();
  });
});
