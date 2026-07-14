import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { CircularProgress, ProgressBar } from "./ProgressBar";
import { Dialog } from "./Dialog";
import { Input } from "./Input";
import { ToastProvider, useToast } from "./Toast";

describe("design-system primitives", () => {
  it("exposes accessible input and progress states", () => {
    render(<><Input id="email" label="E-Mail" error="Ungültige Adresse" /><ProgressBar value={3} max={5} ariaLabel="Kapitel" /><CircularProgress value={60} /></>);
    const input = screen.getByLabelText("E-Mail");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(screen.getByRole("progressbar", { name: "Kapitel" }).getAttribute("aria-valuenow")).toBe("3");
    expect(screen.getAllByRole("progressbar").length).toBe(2);
  });

  it("traps dialog focus, closes with Escape, and restores the trigger", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [open, setOpen] = useState(false);
      return <><Button onClick={() => setOpen(true)}>Öffnen</Button><Dialog open={open} onOpenChange={setOpen} title="Bestätigen" footer={<Button onClick={() => setOpen(false)}>Speichern</Button>} /></>;
    }
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Öffnen" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dialog schließen" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("supports persistent toasts with actions and manual dismissal", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    function Demo() {
      const { toast } = useToast();
      return <Button onClick={() => toast({ title: "Gespeichert", duration: null, action: { label: "Rückgängig", onClick: action } })}>Toast</Button>;
    }
    render(<ToastProvider><Demo /></ToastProvider>);
    await user.click(screen.getByRole("button", { name: "Toast" }));
    expect(screen.getByRole("status").textContent).toContain("Gespeichert");
    await user.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByText("Gespeichert")).toBeNull();
  });
});
