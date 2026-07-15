import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/lib/achievements";
import AchievementsPage from "./page";

describe("achievement screen", () => {
  it("shows locked milestones, individual progress, weekly goal, and freeze availability", () => {
    render(<AchievementsPage />);

    expect(screen.getByRole("heading", { name: "Deine Erfolge" })).toBeTruthy();
    expect(screen.getByText(`0/${ACHIEVEMENTS.length}`)).toBeTruthy();
    expect(screen.getByText("0/3")).toBeTruthy();
    expect(screen.getByText("Verfügbar")).toBeTruthy();
    expect(screen.getAllByRole("progressbar")).toHaveLength(ACHIEVEMENTS.length);
    expect(screen.getByRole("progressbar", { name: "100 aktive Wörter: 0 Prozent" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Hörprofi: 0 Prozent" })).toBeTruthy();
  });
});
