"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

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
            Willkommen zurück
          </h2>
          <p className="text-sm text-muted">
            Melde dich an, um weiterzulernen
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
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-2">
              E-Mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-11"
                placeholder="deine@email.de"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-2">
              Passwort
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-11 pr-12"
                placeholder="••••••••"
                required
                minLength={12}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label htmlFor="remember-login" className="flex items-center gap-2 text-muted cursor-pointer">
              <input
                id="remember-login"
                type="checkbox"
                className="h-4 w-4 rounded border-warm-200 text-primary focus:ring-primary/30"
              />
              Angemeldet bleiben
            </label>
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:text-primary-600 transition-colors"
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full rounded-2xl py-3.5 text-base"
          >
            {isLoading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Noch kein Konto?{" "}
            <Link href="/register" className="font-medium text-primary hover:text-primary-600 transition-colors">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
