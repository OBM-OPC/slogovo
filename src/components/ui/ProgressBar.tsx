import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  ariaLabel?: string;
}

export function ProgressBar({ value, max = 100, className, barClassName, ariaLabel }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-label={ariaLabel}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-300", barClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function CircularProgress({ value, max = 100, size = 72, label, className }: { value: number; max?: number; size?: number; label?: React.ReactNode; className?: string }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(Math.max(value, 0), max)}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-warm-200" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage / 100)} className="text-primary transition-[stroke-dashoffset] duration-300" />
      </svg>
      <span className="absolute text-center text-sm font-bold">{label ?? `${Math.round(percentage)}%`}</span>
    </div>
  );
}
