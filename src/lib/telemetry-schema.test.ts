import { afterEach, describe, expect, it, vi } from "vitest";
import { durationBucket, flushTelemetry, flushTelemetryBeacon, resetTelemetryForTests, trackLearningEvent } from "./telemetry";
import { learningEventNames, monitoringEventNames, parseTelemetryBatch } from "./telemetry-schema";

afterEach(() => {
  resetTelemetryForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("privacy-safe telemetry schema", () => {
  it("accepts every declared learning and monitoring event without an identity", () => {
    const names = [...learningEventNames, ...monitoringEventNames];
    const events = names.map((name) => ({
      id: crypto.randomUUID(),
      category: learningEventNames.includes(name as typeof learningEventNames[number]) ? "learning" : "monitoring",
      name,
      timestamp: new Date().toISOString(),
      properties: {},
    }));
    expect(parseTelemetryBatch({ events })).toHaveLength(names.length);
  });

  it.each(["email", "userId", "ipAddress", "userAgent", "userAnswer", "transcript", "errorMessage", "stack"])(
    "rejects unnecessary or sensitive property '%s'",
    (field) => {
      expect(() => parseTelemetryBatch({
        events: [{
          id: crypto.randomUUID(),
          category: "learning",
          name: "lesson_started",
          timestamp: new Date().toISOString(),
          properties: { [field]: "must-not-be-stored" },
        }],
      })).toThrow();
    }
  );

  it("rejects a mismatched category", () => {
    expect(() => parseTelemetryBatch({ events: [{
      id: crypto.randomUUID(),
      category: "monitoring",
      name: "lesson_started",
      timestamp: new Date().toISOString(),
      properties: {},
    }] })).toThrow(/category/i);
  });

  it("batches only allowlisted properties to the first-party endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    trackLearningEvent("lesson_started", { lessonId: "lesson-1", moduleId: "module-1" });
    await expect(flushTelemetry()).resolves.toBe(true);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body));
    expect(payload.events[0]).toMatchObject({
      category: "learning",
      name: "lesson_started",
      properties: { lessonId: "lesson-1", moduleId: "module-1" },
    });
    expect(JSON.stringify(payload)).not.toMatch(/email|userId|userAnswer|transcript|stack/);
  });

  it("coarsens durations before collection", () => {
    expect(durationBucket(10_000)).toBe("under_30s");
    expect(durationBucket(60_000)).toBe("30s_2m");
    expect(durationBucket(300_000)).toBe("2m_10m");
    expect(durationBucket(900_000)).toBe("over_10m");
  });

  it("uses an unload-safe beacon without adding identity fields", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { onLine: true, sendBeacon });
    trackLearningEvent("daily_session_completed", { count: 5, durationBucket: "2m_10m" });

    expect(flushTelemetryBeacon()).toBe(true);
    expect(sendBeacon).toHaveBeenCalledWith("/api/telemetry", expect.any(Blob));
  });
});
