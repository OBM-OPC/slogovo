"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAuthenticatedUser,
  loginWithPassword,
  logoutSession,
  registerWithPassword,
  type AuthenticatedUser,
} from "@/lib/auth-client";

interface AuthState {
  user: AuthenticatedUser | null;
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
      const user = await fetchAuthenticatedUser();
      if (!user) {
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("[Auth] Error fetching user:", err);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    await loginWithPassword(email, password);
    await fetchUser();
    window.location.href = "/lernen";
    return true;
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      throw new Error("Die Passwörter stimmen nicht überein");
    }

    await registerWithPassword(name, email, password, confirmPassword);
    return true;
  };

  const logout = async () => {
    await logoutSession();
    setState({ user: null, isLoading: false, isAuthenticated: false });
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
