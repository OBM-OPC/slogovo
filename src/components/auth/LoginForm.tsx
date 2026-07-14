"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PasswordField } from "./PasswordField";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setError("");

    if (!email.trim()) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }
    if (password.length < 12) {
      setError("Dein Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Die Anmeldung ist gerade nicht möglich. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-warm-200/80 bg-white p-5 shadow-card sm:p-8">
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold text-foreground">Willkommen zurück</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Setze deinen persönlichen Bulgarisch-Lernweg fort.</p>
      </div>

      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-accent-100 bg-accent-50 p-4 text-sm leading-6 text-accent-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-foreground">E-Mail</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-500" aria-hidden="true" />
            <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input min-h-12 pl-11" placeholder="deine@email.de" required autoComplete="email" inputMode="email" disabled={isLoading} />
          </div>
        </div>

        <PasswordField id="login-password" label="Passwort" value={password} onChange={setPassword} autoComplete="current-password" disabled={isLoading} onCapsLockChange={setCapsLock} />
        {capsLock && <p role="status" className="-mt-3 text-sm font-medium text-gold-800">Feststelltaste ist aktiviert.</p>}

        <div className="flex justify-end">
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline">Passwort vergessen?</Link>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary min-h-14 w-full text-base" aria-busy={isLoading}>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {isLoading ? "Anmeldung läuft …" : "Anmelden"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">Noch kein Konto? <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">Kostenlos registrieren</Link></p>
    </div>
  );
}
