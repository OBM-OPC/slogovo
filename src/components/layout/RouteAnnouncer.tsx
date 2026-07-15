"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const heading = document.querySelector("h1")?.textContent?.trim();
      setMessage(heading ? `${heading} geladen` : "Seite geladen");
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</p>;
}
