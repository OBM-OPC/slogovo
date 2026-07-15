import { cn } from "@/lib/utils";
import { EmptyLearningIllustration } from "@/components/brand/Illustrations";

export function EmptyState({ title, description, illustration, action, className }: { title: string; description: string; illustration?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-dashed border-warm-300 bg-white p-7 text-center", className)}>
      <div className="mx-auto flex min-h-24 items-center justify-center" aria-hidden="true">{illustration ?? <EmptyLearningIllustration />}</div>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
