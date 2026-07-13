import { describe, expect, it, vi } from "vitest";
import { LearningValidationError } from "./learning-errors";
import { logError } from "./structured-log";

describe("structured logging", () => {
  it("emits machine-readable learning error fields without request payloads", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logError(
      "sync.event_rejected",
      new LearningValidationError("UNKNOWN_ITEM", "Unknown item", "exercise:item"),
      { eventType: "lesson_attempt", eventId: "event-1" }
    );

    const entry = JSON.parse(String(spy.mock.calls[0][0]));
    expect(entry).toMatchObject({
      level: "error",
      event: "sync.event_rejected",
      errorCode: "UNKNOWN_ITEM",
      eventType: "lesson_attempt",
      eventId: "event-1",
    });
    expect(entry).not.toHaveProperty("payload");
    spy.mockRestore();
  });
});
