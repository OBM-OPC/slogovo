"use client";

import { useState } from "react";
import { Download, KeyRound, Mail, MonitorOff, Trash2 } from "lucide-react";
import { useProgressStore } from "@/stores/useProgressStore";

async function api(path: string, method: "PATCH" | "DELETE", body?: Record<string, string>) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Aktion fehlgeschlagen");
}

export function AccountControls() {
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="account-security" className="space-y-4">
      <div>
        <h2 id="account-security" className="font-serif text-xl font-bold">Konto & Datenschutz</h2>
        <p className="text-sm text-muted">Sensible Aktionen werden serverseitig geprüft und benötigen dein aktuelles Passwort.</p>
      </div>

      {message && <p role="status" className="rounded-xl bg-warm-50 p-3 text-sm">{message}</p>}

      <a href="/api/account/export" className="flex min-h-12 items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
        <Download className="h-5 w-5 text-primary" />
        <span><strong className="block">Persönliche Daten exportieren</strong><span className="text-xs text-muted">JSON-Datei ohne Sitzungs- oder Provider-Tokens</span></span>
      </a>

      <div className="rounded-2xl bg-white p-4 shadow-card space-y-3">
        <label className="block text-sm font-medium" htmlFor="current-account-password">Aktuelles Passwort</label>
        <input id="current-account-password" className="input" type="password" maxLength={128} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />

        <label className="block text-sm font-medium" htmlFor="new-account-password">Neues Passwort</label>
        <input id="new-account-password" className="input" type="password" minLength={12} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <button disabled={busy || !currentPassword || !newPassword} className="btn-primary w-full" onClick={() => void run(
          () => api("/api/account/password", "PATCH", { currentPassword, newPassword }),
          "Passwort wurde geändert."
        )}><KeyRound className="h-4 w-4" /> Passwort ändern</button>

        <label className="block text-sm font-medium" htmlFor="new-account-email">Neue E-Mail-Adresse</label>
        <input id="new-account-email" className="input" type="email" maxLength={320} autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
        <button disabled={busy || !currentPassword || !newEmail} className="btn-outline w-full" onClick={() => void run(
          () => api("/api/account/email", "PATCH", { currentPassword, newEmail }),
          "Bestätigungslinks wurden an die E-Mail-Adressen gesendet."
        )}><Mail className="h-4 w-4" /> E-Mail ändern</button>
      </div>

      <button disabled={busy} className="btn-outline w-full" onClick={() => void run(
        () => api("/api/account/sessions", "DELETE"),
        "Alle anderen Sitzungen wurden widerrufen."
      )}><MonitorOff className="h-4 w-4" /> Andere Sitzungen widerrufen</button>

      <div className="rounded-2xl border border-accent-100 bg-white p-4 shadow-card space-y-3">
        <p className="text-sm text-muted">Tippe <strong>LÖSCHEN</strong>, um eine Löschaktion freizugeben.</p>
        <label className="sr-only" htmlFor="delete-confirmation">Löschbestätigung</label>
        <input id="delete-confirmation" className="input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="LÖSCHEN" />
        <button disabled={busy || !currentPassword || confirmation !== "LÖSCHEN"} className="btn-outline w-full border-accent text-accent" onClick={() => void run(async () => {
          await api("/api/account/learning-data", "DELETE", { currentPassword, confirmation });
          await resetProgress();
        }, "Deine Lerndaten wurden gelöscht.")}><Trash2 className="h-4 w-4" /> Nur Lerndaten löschen</button>
        <button disabled={busy || !currentPassword || confirmation !== "LÖSCHEN"} className="btn w-full bg-accent text-white" onClick={() => void run(async () => {
          await api("/api/account/delete", "DELETE", { currentPassword, confirmation });
          window.location.href = "/";
        }, "Dein Konto wurde gelöscht.")}><Trash2 className="h-4 w-4" /> Konto endgültig löschen</button>
      </div>
    </section>
  );
}
