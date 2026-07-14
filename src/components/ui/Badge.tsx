import { cn } from "@/lib/utils";

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "primary" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-warm-100 text-warm-800",
    primary: "bg-primary-50 text-primary-800",
    success: "bg-primary-50 text-success",
    warning: "bg-gold-50 text-gold-800",
    danger: "bg-accent-50 text-danger",
  };
  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)} {...props} />;
}
