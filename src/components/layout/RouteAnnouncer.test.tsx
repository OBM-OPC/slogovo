import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteAnnouncer } from "./RouteAnnouncer";

vi.mock("next/navigation", () => ({ usePathname: () => "/lernen" }));

describe("RouteAnnouncer", () => {
  afterEach(() => vi.useRealTimers());

  it("announces the page heading after navigation content has rendered", () => {
    vi.useFakeTimers();
    render(<><h1>Lernen</h1><RouteAnnouncer /></>);

    act(() => vi.advanceTimersByTime(100));

    expect(screen.getByRole("status").textContent).toBe("Lernen geladen");
  });
});
