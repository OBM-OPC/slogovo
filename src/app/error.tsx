"use client";

import { useEffect } from "react";
import { trackMonitoringEvent } from "@/lib/telemetry";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    trackMonitoringEvent("content_loading_error", {
      errorCode: "CONTENT_LOAD_FAILED",
      online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
    });
  }, []);

  return (
    <main className="px-4 py-10 text-center">
      <h1 className="mb-2 text-2xl font-bold">Inhalt konnte nicht geladen werden</h1>
      <p className="mb-6 text-muted">Bitte versuche es erneut. Es wurden keine persönlichen Fehlerdetails übertragen.</p>
      <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-primary px-5 py-3 font-medium text-white">
        Erneut versuchen
      </button>
    </main>
  );
}
