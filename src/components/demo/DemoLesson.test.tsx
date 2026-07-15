import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DemoLesson } from "./DemoLesson";

describe("DemoLesson", () => {
  it("guides a visitor through five vocabulary cards, listening feedback, matching, and registration", async () => {
    const user = userEvent.setup();
    render(<DemoLesson />);

    for (let card = 1; card <= 5; card += 1) {
      expect(screen.getByText(`${card} / 5`)).toBeTruthy();
      await user.click(screen.getByRole("button", { name: "Bedeutung zeigen" }));
      await user.click(screen.getByRole("button", { name: card === 5 ? /Weiter zur Hörübung/ : /Nächstes Wort/ }));
    }

    await user.click(screen.getByRole("button", { name: "Phrase anhören" }));
    await user.click(screen.getByRole("button", { name: "Guten Morgen" }));
    expect(screen.getByText(/Die richtige Antwort ist „Danke“/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Danke" }));
    await user.click(screen.getByRole("button", { name: /Weiter zur Zuordnung/ }));

    await user.click(screen.getByRole("button", { name: "Здравей" }));
    await user.click(screen.getByRole("button", { name: "Hallo" }));
    await user.click(screen.getByRole("button", { name: "Моля" }));
    await user.click(screen.getByRole("button", { name: "Bitte" }));
    await user.click(screen.getByRole("button", { name: "Довиждане" }));
    await user.click(screen.getByRole("button", { name: "Auf Wiedersehen" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: /Du hast fünf Wörter kennengelernt/ })).toBeTruthy());
    expect(screen.getByRole("link", { name: /Lernweg kostenlos starten/ }).getAttribute("href")).toBe("/register");
    expect(screen.getAllByText("100 %").length).toBeGreaterThanOrEqual(2);
  });
});
