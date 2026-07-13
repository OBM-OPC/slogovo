import { describe, expect, it } from "vitest";
import { createActiveTimeTracker, msToSeconds } from "./active-time";

describe("createActiveTimeTracker", () => {
  it("starts on meaningful interaction and records actual seconds", () => {
    const tracker = createActiveTimeTracker({ idleThresholdMs: 60_000 });
    tracker.recordActivity(1_000);
    tracker.recordActivity(31_000);
    expect(msToSeconds(tracker.stop(31_000))).toBe(30);
  });

  it("caps prolonged inactivity", () => {
    const tracker = createActiveTimeTracker({ idleThresholdMs: 60_000 });
    tracker.start(0);
    tracker.recordActivity(10 * 60_000);
    expect(tracker.stop(10 * 60_000)).toBe(60_000);
  });

  it("does not add time twice when stopped more than once", () => {
    const tracker = createActiveTimeTracker();
    tracker.start(0);
    expect(tracker.stop(10_000)).toBe(10_000);
    expect(tracker.stop(20_000)).toBe(10_000);
  });
});
