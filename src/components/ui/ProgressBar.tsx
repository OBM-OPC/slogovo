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
