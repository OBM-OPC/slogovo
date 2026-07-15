import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const login = vi.fn();
const register = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login, register }),
}));

describe("authentication forms", () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
  });

  it("offers password visibility, actionable validation, and Caps Lock feedback on login", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText("Passwort");
    expect(password.getAttribute("type")).toBe("password");
    await user.click(screen.getByRole("button", { name: "Passwort anzeigen" }));
    expect(password.getAttribute("type")).toBe("text");

    const capsEvent = new KeyboardEvent("keydown", { bubbles: true });
    Object.defineProperty(capsEvent, "getModifierState", { value: (key: string) => key === "CapsLock" });
    fireEvent(password, capsEvent);
    expect(screen.getByText("Feststelltaste ist aktiviert.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Anmelden" }));
    expect(screen.getByRole("alert").textContent).toContain("E-Mail-Adresse");
    expect(login).not.toHaveBeenCalled();
  });

  it("shows live strength checks, toggles both registration password fields, and prevents mismatched submission", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Passwort"), "SicheresPasswort2026");
    expect(screen.getByText("4 / 4")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Passwort anzeigen" }));
    await user.click(screen.getByRole("button", { name: "Passwort bestätigen anzeigen" }));
    expect(screen.getByLabelText("Passwort").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Passwort bestätigen").getAttribute("type")).toBe("text");

    await user.type(screen.getByLabelText("Passwort bestätigen"), "anderes-passwort");
    expect(screen.getByText("Die Passwörter stimmen noch nicht überein.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Konto erstellen" }).hasAttribute("disabled")).toBe(true);
    expect(register).not.toHaveBeenCalled();
  });

  it("prevents double registration submissions while the request is pending", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    register.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^Name/), "Mila");
    await user.type(screen.getByLabelText("E-Mail"), "mila@example.com");
    await user.type(screen.getByLabelText("Passwort"), "SicheresPasswort2026");
    await user.type(screen.getByLabelText("Passwort bestätigen"), "SicheresPasswort2026");
    const submit = screen.getByRole("button", { name: "Konto erstellen" });
    await user.click(submit);
    await user.click(submit);

    expect(register).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Konto wird erstellt/ }).hasAttribute("disabled")).toBe(true);
    finish();
  });
});
