import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "./BottomNav";
import { PrimaryNav } from "./PrimaryNav";

let pathname = "/lernen";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("primary product navigation", () => {
  beforeEach(() => { pathname = "/lernen"; });

  it("shows exactly five mobile areas with an announced current page", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Hauptnavigation" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Home", "Lernen", "Wiederholen", "Fortschritt", "Profil"]);
    expect(within(nav).getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
  });

  it("puts grammar, alphabet, and vocabulary under the desktop Learn menu", async () => {
    const user = userEvent.setup();
    pathname = "/grammatik";
    render(<PrimaryNav />);
    await user.click(screen.getByText("Lernen", { selector: "summary" }));
    expect(screen.getByRole("link", { name: "Grammatik" }).getAttribute("href")).toBe("/grammatik");
    expect(screen.getByRole("link", { name: "Alphabet" }).getAttribute("href")).toBe("/alphabet");
    expect(screen.getByRole("link", { name: "Wortschatz" }).getAttribute("href")).toBe("/vokabeln");
    expect(screen.getByText("Lernen", { selector: "summary" }).getAttribute("aria-current")).toBe("page");
  });
});
