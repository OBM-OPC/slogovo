import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-warm-200", className)} aria-hidden="true" />;
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-2">{Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")} />)}</div>;
}

export function CardSkeleton() {
  return <div className="rounded-3xl bg-white p-5 shadow-card"><Skeleton className="h-6 w-1/3" /><Skeleton className="mt-4 h-24 w-full" /><Skeleton className="mt-4 h-12 w-full" /></div>;
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return <div className="space-y-3">{Array.from({ length: items }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-2xl bg-white p-3"><Skeleton className="h-11 w-11 shrink-0 rounded-full" /><div className="flex-1"><TextSkeleton lines={2} /></div></div>)}</div>;
}

export function LearningSkeleton() {
  return <main className="px-4 py-6 safe-top" aria-busy="true" aria-label="Lerninhalt wird geladen"><span className="sr-only" role="status">Lerninhalt wird geladen</span><Skeleton className="mb-6 h-8 w-2/3" /><CardSkeleton /></main>;
}
