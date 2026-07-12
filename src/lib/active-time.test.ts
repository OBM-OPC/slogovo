import { describe, expect, it } from "vitest";
import { createActiveTimeTracker, msToRoundedMinutes } from "./active-time";

describe("createActiveTimeTracker", () => {
  it("tracks active time across start and pause cycles", () => {
    const tracker = createActiveTimeTracker();
    tracker.start();
    const elapsed1 = tracker.pause();
    expect(elapsed1).toBeGreaterThanOrEqual(0);
    tracker.resume();
    tracker.pause();
    const total = tracker.stop();
    expect(total).toBeGreaterThanOrEqual(elapsed1);
  });

  it("returns total including running segment", async () => {
    const tracker = createActiveTimeTracker();
    tracker.start();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const total = tracker.getTotalMs();
    expect(total).toBeGreaterThanOrEqual(15);
    tracker.stop();
  });

  it("resets on stop", () => {
    const tracker = createActiveTimeTracker();
    tracker.start();
    tracker.pause();
    const total = tracker.stop();
    expect(total).toBeGreaterThanOrEqual(0);
    expect(tracker.getTotalMs()).toBe(0);
  });
});

describe("msToRoundedMinutes", () => {
  it("rounds to nearest minute", () => {
    expect(msToRoundedMinutes(0)).toBe(0);
    expect(msToRoundedMinutes(30000)).toBe(1);
    expect(msToRoundedMinutes(90000)).toBe(2);
    expect(msToRoundedMinutes(60000)).toBe(1);
  });
});
