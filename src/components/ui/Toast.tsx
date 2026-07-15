"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "warning" | "danger";
interface ToastInput { title: string; description?: string; tone?: ToastTone; duration?: number | null; action?: { label: string; onClick: () => void } }
interface ToastItem extends ToastInput { id: string }
const ToastContext = createContext<{ toast: (input: ToastInput) => string; dismiss: (id: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { ...input, id }]);
    if (input.duration !== null) window.setTimeout(() => dismiss(id), input.duration ?? 4500);
    return id;
  }, [dismiss]);
  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);
  return <ToastContext.Provider value={value}>{children}<ToastViewport items={items} dismiss={dismiss} /></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

function ToastViewport({ items, dismiss }: { items: ToastItem[]; dismiss: (id: string) => void }) {
  const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: TriangleAlert };
  return <div className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-center gap-2 safe-top sm:left-auto sm:right-4 sm:w-96" aria-live="polite">{items.map((item) => { const tone = item.tone ?? "info"; const Icon = icons[tone]; return <div key={item.id} role={tone === "danger" ? "alert" : "status"} className={cn("pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl", tone === "danger" && "border-accent-200", tone === "warning" && "border-gold-200", tone === "success" && "border-primary-200", tone === "info" && "border-warm-200")}><Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone === "danger" && "text-danger", tone === "warning" && "text-gold-700", tone === "success" && "text-success", tone === "info" && "text-primary")} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-bold">{item.title}</p>{item.description && <p className="mt-1 text-sm leading-5 text-muted">{item.description}</p>}{item.action && <button type="button" onClick={() => { item.action?.onClick(); dismiss(item.id); }} className="mt-2 min-h-11 text-sm font-bold text-primary underline">{item.action.label}</button>}</div><button type="button" onClick={() => dismiss(item.id)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-warm-100" aria-label="Meldung schließen"><X className="h-4 w-4" aria-hidden="true" /></button></div>; })}</div>;
}
