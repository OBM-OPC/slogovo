import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashboardData } from "@/lib/dashboard";
import { DashboardHome } from "./DashboardHome";

afterEach(() => vi.unstubAllGlobals());

const dashboard: DashboardData = {
  nextAction: { href: "/heute-lernen", eyebrow: "Als Nächstes", title: "Begrüßung", description: "Weiter in Alltag", duration: "6 Min.", moduleTitle: "Alltag", moduleProgress: 40, moduleCompleted: 2, moduleTotal: 5 },
  review: { due: 8, estimatedMinutes: 3 },
  weeklyGoal: { completedDays: 2, targetDays: 5, percent: 40 },
  stats: { streak: 4, lessons: 7, activeMinutes: 85, masteredWords: 21 },
  nextAchievement: { id: "words", icon: "🧠", title: "25 Wörter", description: "Wörter meistern", current: 21, target: 25, percent: 84 },
};

describe("DashboardHome", () => {
  it("renders only the authenticated server dashboard response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ dashboard }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<DashboardHome />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Begrüßung" })).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard", { credentials: "same-origin", cache: "no-store" });
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByText("2/5")).toBeTruthy();
    expect(screen.getByText("85")).toBeTruthy();
    expect(screen.getByText("21/25")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Heute lernen/ }).getAttribute("href")).toBe("/heute-lernen");
  });
});
