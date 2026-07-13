export function LearningSkeleton() {
  return (
    <main className="px-4 py-6 safe-top" aria-busy="true" aria-label="Lerninhalt wird geladen">
      <span className="sr-only" role="status">Lerninhalt wird geladen</span>
      <div className="mb-6 h-8 w-2/3 animate-pulse rounded-xl bg-warm-200" />
      <div className="card space-y-4">
        <div className="h-5 w-1/3 animate-pulse rounded-lg bg-warm-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-warm-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-warm-200" />
      </div>
    </main>
  );
}
