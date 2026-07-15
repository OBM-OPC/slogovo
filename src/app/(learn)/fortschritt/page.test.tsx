import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressInsights } from "@/lib/progress-insights";
import ProgressPage from "./page";

afterEach(() => vi.unstubAllGlobals());

const insights: ProgressInsights = {
  activeStudyMinutes: 95,
  lessonsPassed: 8,
  lessonsMastered: 3,
  wordsLearned: 42,
  vocabularyDue: 2,
  receptiveVocabularyMastered: 40,
  productiveVocabularyMastered: 12,
  grammarSkills: [],
  listening: { correct: 8, total: 10, accuracy: 0.8 },
  grammar: { correct: 7, total: 10, accuracy: 0.7 },
  weeklyGoal: { completedDays: 3, targetDays: 4, percent: 75 },
  reviewCompletion: { completed: 6, due: 8, percent: 75 },
  weakAreas: [],
  recentImprovement: null,
};

describe("progress dashboard", () => {
  it("renders the authenticated server calculation without client progress state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ insights }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ProgressPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Was du wirklich gelernt hast" })).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("/api/progress/insights", { credentials: "same-origin", cache: "no-store" });
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("1 Std. 35 Min.")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Hörverstehen: 80 Prozent" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Grammatik-Mastery: 70 Prozent" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Wochenziel: 3 von 4 Lerntagen" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Wiederholungen: 6 von 8 erledigt" })).toBeTruthy();
  });
});
