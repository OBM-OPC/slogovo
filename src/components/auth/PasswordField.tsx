"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
  error?: string;
  onCapsLockChange?: (active: boolean) => void;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled = false,
  error,
  onCapsLockChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const detectCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onCapsLockChange?.(event.getModifierState("CapsLock"));
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-500" aria-hidden="true" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={detectCapsLock}
          onKeyUp={detectCapsLock}
          onBlur={() => onCapsLockChange?.(false)}
          className={cn("input min-h-12 pl-11 pr-14", error && "border-danger focus:border-danger focus:ring-danger/20")}
          placeholder="••••••••••••"
          required
          minLength={12}
          maxLength={128}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-warm-100 hover:text-foreground disabled:opacity-50"
          aria-label={visible ? `${label} verbergen` : `${label} anzeigen`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    [password.length >= 12, "Mindestens 12 Zeichen"],
    [/[A-ZÄÖÜ]/.test(password), "Ein Großbuchstabe"],
    [/[a-zäöüß]/.test(password), "Ein Kleinbuchstabe"],
    [/\d/.test(password), "Eine Zahl"],
  ] as const;
  const passed = checks.filter(([isValid]) => isValid).length;

  return (
    <div className="mt-3 rounded-2xl bg-warm-50 p-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span>Passwortstärke</span>
        <span className={cn(passed <= 1 && "text-danger", passed === 2 && "text-gold-800", passed >= 3 && "text-success")}>{passed} / 4</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {checks.map(([isValid, label]) => (
          <span key={label} className={cn("flex items-center gap-1.5 text-xs", isValid ? "text-success" : "text-warm-600")}>
            {isValid ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
            {label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">Mindestens 12 Zeichen sind Pflicht. Die übrigen Merkmale stärken dein Passwort; eine lange, einzigartige Passphrase bleibt ebenfalls möglich.</p>
    </div>
  );
}
