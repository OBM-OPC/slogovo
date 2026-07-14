import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lesson } from "@/types";
import { LessonView } from "./LessonView";

const recordLessonAttempt = vi.fn();
const telemetry = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@/lib/telemetry", () => ({
  durationBucket: vi.fn(() => "under_30s"),
  trackLearningEvent: telemetry.track,
}));

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
      required: false,
    }],
  }],
};

describe("LessonView retry flow", () => {
  beforeEach(() => {
    recordLessonAttempt.mockReset();
    telemetry.track.mockReset();
  });

  it("keeps progress visible and moves a learner-selected item into the retry flow", async () => {
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
    expect(screen.getByText("Frage 1 von 1")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: /Lektionsfortschritt/ })).toBeTruthy();
    expect(screen.getByLabelText("0:00 Lernzeit")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Falsch" }).className).toContain("min-h-14");
    await waitFor(() => expect(document.activeElement?.getAttribute("aria-label")).toBe("Aktueller Lektionsschritt"));
    fireEvent.click(screen.getByRole("button", { name: "Falsch" }));
    fireEvent.click(screen.getByRole("button", { name: "Später wiederholen" }));
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));

    expect(screen.getByText("Fehler wiederholen")).toBeTruthy();
    expect(telemetry.track).toHaveBeenCalledWith("lesson_started", {
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
    });
    expect(telemetry.track).toHaveBeenCalledWith("exercise_answered", expect.objectContaining({
      exerciseId: "quiz-retry",
      itemId: "required-question",
      outcome: "incorrect",
    }));
    expect(telemetry.track).toHaveBeenCalledWith("item_failed", expect.objectContaining({
      itemId: "required-question",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Wiederholung starten" }));
    expect(screen.getByPlaceholderText("Antwort eingeben")).toBeTruthy();
    expect(screen.getByText("Welche Antwort?")).toBeTruthy();
  });
});
