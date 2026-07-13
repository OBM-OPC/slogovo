"use client";

import type {
  LearningEventName,
  MonitoringEventName,
  TelemetryEvent,
  TelemetryProperties,
} from "./telemetry-schema";

const queue: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function newId(): string {
  return crypto.randomUUID();
}

function enqueue(
  category: "learning" | "monitoring",
  name: LearningEventName | MonitoringEventName,
  properties: TelemetryProperties
): void {
  if (typeof window === "undefined") return;
  queue.push({
    id: newId(),
    category,
    name,
    timestamp: new Date().toISOString(),
    properties,
  });
  if (process.env.NODE_ENV !== "test" && !flushTimer) {
    flushTimer = setTimeout(() => void flushTelemetry(), 1_000);
  }
}

export function trackLearningEvent(name: LearningEventName, properties: TelemetryProperties = {}): void {
  enqueue("learning", name, properties);
}

export function trackMonitoringEvent(name: MonitoringEventName, properties: TelemetryProperties = {}): void {
  enqueue("monitoring", name, properties);
}

export async function flushTelemetry(): Promise<boolean> {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (queue.length === 0 || typeof window === "undefined") return true;
  const events = queue.splice(0, 50);
  try {
    const response = await fetch("/api/telemetry", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
    if (!response.ok) throw new Error("telemetry rejected");
    if (queue.length > 0) flushTimer = setTimeout(() => void flushTelemetry(), 250);
    return true;
  } catch {
    queue.unshift(...events);
    return false;
  }
}

/** Uses the browser's unload-safe transport without adding identifiers. */
export function flushTelemetryBeacon(): boolean {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (queue.length === 0 || typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return queue.length === 0;
  }
  const events = queue.splice(0, 50);
  const accepted = navigator.sendBeacon(
    "/api/telemetry",
    new Blob([JSON.stringify({ events })], { type: "application/json" })
  );
  if (!accepted) queue.unshift(...events);
  return accepted;
}

export function durationBucket(milliseconds: number): TelemetryProperties["durationBucket"] {
  if (milliseconds < 30_000) return "under_30s";
  if (milliseconds < 120_000) return "30s_2m";
  if (milliseconds < 600_000) return "2m_10m";
  return "over_10m";
}

export function resetTelemetryForTests(): void {
  queue.splice(0, queue.length);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
}
