import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultProgress } from "@/lib/progress-db";

const mocks = vi.hoisted(() => ({
  updateSettings: vi.fn().mockResolvedValue(undefined),
  progress: undefined as unknown,
}));

vi.mock("@/hooks/useProgressSafe", () => ({ useProgressSafe: () => mocks.progress }));
vi.mock("@/stores/useProgressStore", () => ({
  useProgressStore: (selector: (state: { updateSettings: typeof mocks.updateSettings }) => unknown) => selector({ updateSettings: mocks.updateSettings }),
}));

import OnboardingPage from "./page";

describe("personalized onboarding", () => {
  beforeEach(() => {
    mocks.updateSettings.mockClear();
    mocks.progress = createDefaultProgress("onboarding-test");
  });

  it("asks one question at a time and persists the derived preferences", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    expect(screen.getByRole("heading", { name: "Dein Lernweg, dein Tempo" })).toBeTruthy();
    expect(screen.getByText("Schritt 1 von 5")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Warum lernst du Bulgarisch?" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Kannst du Kyrillisch lesen?" })).toBeNull();

    await user.click(screen.getByRole("radio", { name: /Arbeit/ }));
    await user.click(screen.getByRole("button", { name: /Weiter/ }));
    await user.click(screen.getByRole("radio", { name: "Ja" }));
    await user.click(screen.getByRole("button", { name: /Weiter/ }));
    await user.click(screen.getByRole("radio", { name: /Schon recht viel/ }));
    await user.click(screen.getByRole("button", { name: /Weiter/ }));
    await user.click(screen.getByRole("radio", { name: /30 Minuten/ }));
    await user.click(screen.getByRole("button", { name: /Weiter/ }));

    expect(screen.getByText("Schritt 5 von 5")).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Nein, nur Kyrillisch" }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("button", { name: "Lernweg erstellen" }));

    await waitFor(() => expect(mocks.updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      dailyGoal: "intense",
      showLatin: false,
      onboarding: expect.objectContaining({
        completed: true,
        learningGoal: "work",
        knowsCyrillic: true,
        priorBulgarian: "intermediate",
        recommendedPath: "a1-review",
      }),
    })));
    expect(await screen.findByRole("heading", { name: "A1-Einstiegscheck" })).toBeTruthy();
    expect(screen.getByText("Dein Wochenziel: an 3 Tagen lernen")).toBeTruthy();
  });

  it("offers a skippable safe default path", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Überspringen und empfohlen starten" }));

    await waitFor(() => expect(mocks.updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      dailyGoal: "medium",
      showLatin: true,
      onboarding: expect.objectContaining({ completed: true, recommendedPath: "alphabet" }),
    })));
    expect(await screen.findByRole("heading", { name: "Kyrillisch zuerst" })).toBeTruthy();
  });
});
