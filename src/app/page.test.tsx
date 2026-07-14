import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("landing page", () => {
  it("presents one dominant registration action, a product preview, trust signals, FAQ, and legal links", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: /Bulgarisch, das du im Alltag wirklich sprichst/i })).toBeTruthy();
    expect(screen.getByText("5–10 Minuten pro Lektion")).toBeTruthy();
    expect(screen.getByLabelText("Vorschau der Slogovo-Lernoberfläche")).toBeTruthy();
    expect(screen.getByText("60")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Häufige Fragen" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Datenschutz" }).getAttribute("href")).toBe("/datenschutz");
    expect(screen.getByRole("link", { name: "Impressum" }).getAttribute("href")).toBe("/impressum");

    const registrationLinks = screen.getAllByRole("link", { name: /Kostenlos starten/ });
    expect(registrationLinks.length).toBeGreaterThanOrEqual(2);
    registrationLinks.forEach((link) => expect(link.getAttribute("href")).toBe("/register"));
  });
});
