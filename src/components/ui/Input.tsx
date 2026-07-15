import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  isLoading?: boolean;
}

export function Input({ id, label, error, hint, isLoading = false, className, disabled, ...props }: InputProps) {
  const inputId = id ?? props.name;
  if (!inputId) throw new Error("Input requires an id or name for its accessible label");
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="relative">
        <input id={inputId} disabled={disabled || isLoading} aria-invalid={Boolean(error)} aria-describedby={descriptionId} className={cn("input min-h-12 pr-11", error && "border-danger focus:border-danger focus:ring-danger/20", className)} {...props} />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted" aria-hidden="true" />}
      </div>
      {error ? <p id={`${inputId}-error`} className="mt-2 text-sm text-danger">{error}</p> : hint ? <p id={`${inputId}-hint`} className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
