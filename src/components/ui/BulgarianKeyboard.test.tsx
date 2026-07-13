import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BulgarianKeyboard } from "./BulgarianKeyboard";

describe("BulgarianKeyboard", () => {
  it("exposes optional Bulgarian characters with accessible controls", () => {
    const onInsert = vi.fn();
    render(<BulgarianKeyboard onInsert={onInsert} />);

    const toggle = screen.getByRole("button", { name: "Bulgarische Tastaturhilfe" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "ъ einfügen" }));
    expect(onInsert).toHaveBeenCalledWith("ъ");
  });
});
