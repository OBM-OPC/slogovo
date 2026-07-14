"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "modal" | "alert" | "confirm";
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, variant = "modal", children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const titleId = `dialog-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) { event.preventDefault(); panel?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; previouslyFocused?.focus(); };
  }, [onOpenChange, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <div className="absolute inset-0 bg-foreground/45 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={panelRef}
        role={variant === "alert" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 max-h-[calc(var(--visual-viewport-height,100dvh)-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
        onTouchStart={(event) => { touchStartY.current = panelRef.current?.scrollTop === 0 ? event.touches[0]?.clientY ?? null : null; }}
        onTouchEnd={(event) => {
          const start = touchStartY.current;
          touchStartY.current = null;
          if (start !== null && (event.changedTouches[0]?.clientY ?? start) - start > 80) onOpenChange(false);
        }}
      >
        <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-warm-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-start gap-3">
          {variant !== "modal" && <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", variant === "alert" ? "bg-accent-50 text-danger" : "bg-gold-50 text-gold-800")}><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>}
          <div className="min-w-0 flex-1"><h2 id={titleId} className="text-xl font-bold">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}</div>
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-warm-100" aria-label="Dialog schließen"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
