"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PasswordField, PasswordStrength } from "./PasswordField";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const confirmationError = useMemo(() => confirmPassword && password !== confirmPassword ? "Die Passwörter stimmen noch nicht überein." : "", [confirmPassword, password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setError("");

    if (name.trim().length > 0 && name.trim().length < 2) {
      setError("Bitte gib mindestens zwei Zeichen für deinen Namen ein.");
      return;
    }
    if (!email.trim()) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (password.length < 12) {
      setError("Wähle ein Passwort mit mindestens 12 Zeichen.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein. Prüfe beide Eingaben.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Die Registrierung ist gerade nicht möglich. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full rounded-3xl border border-warm-200 bg-white p-6 text-center shadow-card sm:p-8" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50"><CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" /></div>
        <h2 className="mt-5 text-2xl font-bold">Anfrage erhalten</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Falls für diese E-Mail noch kein Konto besteht, erhältst du eine Nachricht mit den nächsten Schritten. Prüfe bitte auch deinen Spam-Ordner.</p>
        <Link href="/login" className="btn-primary mt-6 min-h-14 w-full">Zum Login</Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-warm-200/80 bg-white p-5 shadow-card sm:p-8">
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold">Konto erstellen</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Starte kostenlos und erhalte deinen persönlichen Lernweg.</p>
      </div>

      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-accent-100 bg-accent-50 p-4 text-sm leading-6 text-accent-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="register-name" className="mb-2 block text-sm font-semibold">Name <span className="font-normal text-muted">(optional)</span></label>
          <div className="relative"><User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-500" aria-hidden="true" /><input id="register-name" type="text" value={name} onChange={(event) => setName(event.target.value)} className="input min-h-12 pl-11" placeholder="Dein Name" autoComplete="name" disabled={isLoading} /></div>
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-semibold">E-Mail</label>
          <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-500" aria-hidden="true" /><input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input min-h-12 pl-11" placeholder="deine@email.de" required autoComplete="email" inputMode="email" disabled={isLoading} /></div>
        </div>

        <div>
          <PasswordField id="register-password" label="Passwort" value={password} onChange={setPassword} autoComplete="new-password" disabled={isLoading} onCapsLockChange={setCapsLock} />
          <PasswordStrength password={password} />
        </div>

        <PasswordField id="register-password-confirmation" label="Passwort bestätigen" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" disabled={isLoading} error={confirmationError} onCapsLockChange={setCapsLock} />
        {capsLock && <p role="status" className="-mt-3 text-sm font-medium text-gold-800">Feststelltaste ist aktiviert.</p>}

        <p className="text-xs leading-5 text-muted">Mit deiner Registrierung akzeptierst du unsere <Link href="/datenschutz" className="font-semibold text-primary underline">Datenschutzerklärung</Link> und bestätigst, das <Link href="/impressum" className="font-semibold text-primary underline">Impressum</Link> gelesen zu haben.</p>

        <button type="submit" disabled={isLoading || Boolean(confirmationError)} className="btn-primary min-h-14 w-full text-base" aria-busy={isLoading}>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {isLoading ? "Konto wird erstellt …" : "Konto erstellen"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">Bereits registriert? <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">Anmelden</Link></p>
    </div>
  );
}
