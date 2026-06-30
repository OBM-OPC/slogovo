"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { motion } from "framer-motion";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (!token) {
      setError("Ungültiger oder abgelaufener Token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ein Fehler ist aufgetreten");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="rounded-3xl bg-white p-8 shadow-card text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Ungültiger Link
          </h2>
          <p className="text-sm text-muted mb-6">
            Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.
          </p>
          <Link
            href="/forgot-password"
            className="btn-primary w-full rounded-2xl py-3.5 text-base"
          >
            Neuen Link anfordern
          </Link>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="rounded-3xl bg-white p-8 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
            Passwort zurückgesetzt!
          </h2>
          <p className="text-sm text-muted mb-6">
            Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.
          </p>
          <Link
            href="/login"
            className="btn-primary w-full rounded-2xl py-3.5 text-base"
          >
            Zum Login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-3xl bg-white p-8 shadow-card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-1">
            Neues Passwort
          </h2>
          <p className="text-sm text-muted">
            Wähle ein neues Passwort für dein Konto
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl bg-accent-50 p-4 text-sm text-accent"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Neues Passwort
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-11 pr-12"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Passwort bestätigen
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-11"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full rounded-2xl py-3.5 text-base"
          >
            {isLoading ? "Wird gespeichert..." : "Passwort speichern"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto p-8 text-center text-muted">Lade...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
