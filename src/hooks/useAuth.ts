"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  displayName: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        console.log("[Auth] User loaded:", data.user?.id);
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        console.warn("[Auth] /api/auth/me failed:", response.status);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (err) {
      console.error("[Auth] Error fetching user:", err);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login fehlgeschlagen");
    }

    await fetchUser();
    window.location.href = "/lernen";
    return true;
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registrierung fehlgeschlagen");
    }

    return true;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    window.location.href = "/login";
  };

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser: fetchUser,
  };
}
