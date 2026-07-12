export interface ActiveTimeTracker {
  start(): void;
  pause(): number; // returns elapsed ms since start/resume
  resume(): void;
  stop(): number; // returns total elapsed ms
  getTotalMs(): number;
}

export function createActiveTimeTracker(): ActiveTimeTracker {
  let totalMs = 0;
  let lastStart: number | null = null;
  let running = false;

  function now(): number {
    return Date.now();
  }

  return {
    start() {
      if (!running) {
        lastStart = now();
        running = true;
      }
    },
    pause() {
      if (running && lastStart !== null) {
        const elapsed = now() - lastStart;
        totalMs += elapsed;
        running = false;
        lastStart = null;
        return elapsed;
      }
      return 0;
    },
    resume() {
      if (!running) {
        lastStart = now();
        running = true;
      }
    },
    stop() {
      this.pause();
      const result = totalMs;
      totalMs = 0;
      running = false;
      lastStart = null;
      return result;
    },
    getTotalMs() {
      if (running && lastStart !== null) {
        return totalMs + (now() - lastStart);
      }
      return totalMs;
    },
  };
}

export function msToRoundedMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

export function msToSeconds(ms: number): number {
  return Math.round(ms / 1000);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _keepMsToSeconds(): void {
  void msToSeconds(0);
}
