"use client";

import { useEffect } from "react";

function isEditable(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.matches("input, textarea, select, [contenteditable='true']");
}

export function MobileInteractionManager() {
  useEffect(() => {
    let timer = 0;
    const reveal = (element: HTMLElement) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }), 180);
    };
    const onFocus = (event: FocusEvent) => { if (isEditable(event.target as Element)) reveal(event.target as HTMLElement); };
    const onViewportChange = () => {
      if (window.visualViewport) document.documentElement.style.setProperty("--visual-viewport-height", `${window.visualViewport.height}px`);
      if (isEditable(document.activeElement)) reveal(document.activeElement);
    };
    document.addEventListener("focusin", onFocus);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);
    onViewportChange();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocus);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, []);
  return null;
}
