"use client";

import { useEffect } from "react";
import { flushTelemetry, flushTelemetryBeacon, trackMonitoringEvent } from "@/lib/telemetry";

export function TelemetryMonitor() {
  useEffect(() => {
    const onError = () => {
      trackMonitoringEvent("client_crash", { errorCode: "UNHANDLED_ERROR", online: navigator.onLine });
      void flushTelemetry();
    };
    const onUnhandledRejection = () => {
      trackMonitoringEvent("client_crash", { errorCode: "UNHANDLED_REJECTION", online: navigator.onLine });
      void flushTelemetry();
    };
    const onPageHide = () => void flushTelemetryBeacon();
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
