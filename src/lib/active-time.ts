export interface ActiveTimeTracker {
  start(atMs?: number): void;
  recordActivity(atMs?: number): void;
  pause(atMs?: number): number;
  resume(atMs?: number): void;
  stop(atMs?: number): number;
  getTotalMs(atMs?: number): number;
}

export interface ActiveTimeOptions {
  /** Gaps beyond this threshold are treated as inactivity. */
  idleThresholdMs?: number;
}

export function createActiveTimeTracker(options: ActiveTimeOptions = {}): ActiveTimeTracker {
  const idleThresholdMs = options.idleThresholdMs ?? 60_000;
  let totalMs = 0;
  let lastActivity: number | null = null;
  let running = false;

  const now = (atMs?: number) => atMs ?? Date.now();

  function capture(atMs?: number): number {
    if (!running || lastActivity === null) return 0;
    const current = now(atMs);
    const elapsed = Math.max(0, Math.min(current - lastActivity, idleThresholdMs));
    totalMs += elapsed;
    lastActivity = current;
    return elapsed;
  }

  return {
    start(atMs) {
      if (running) return;
      lastActivity = now(atMs);
      running = true;
    },
    recordActivity(atMs) {
      if (!running) {
        this.start(atMs);
        return;
      }
      capture(atMs);
    },
    pause(atMs) {
      const elapsed = capture(atMs);
      running = false;
      lastActivity = null;
      return elapsed;
    },
    resume(atMs) {
      if (!running) this.start(atMs);
    },
    stop(atMs) {
      this.pause(atMs);
      return totalMs;
    },
    getTotalMs(atMs) {
      if (!running || lastActivity === null) return totalMs;
      return totalMs + Math.max(0, Math.min(now(atMs) - lastActivity, idleThresholdMs));
    },
  };
}

export function msToRoundedMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

export function msToSeconds(ms: number): number {
  return Math.round(ms / 1000);
}
