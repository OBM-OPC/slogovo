import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileInteractionManager } from "./MobileInteractionManager";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("MobileInteractionManager", () => {
  it("scrolls a focused input above the software keyboard", () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const { getByLabelText } = render(<><MobileInteractionManager /><label>Eingabe<input aria-label="Eingabe" /></label></>);

    fireEvent.focusIn(getByLabelText("Eingabe"));
    vi.advanceTimersByTime(200);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center", inline: "nearest" });
  });
});
