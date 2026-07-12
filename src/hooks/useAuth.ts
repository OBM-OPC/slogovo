"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      setState({
        user: {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name || null,
          image: user.user_metadata?.avatar_url || null,
          displayName: user.user_metadata?.display_name || null,
          bio: user.user_metadata?.bio || null,
        },
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("[Auth] Error fetching user:", err);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message || "Login fehlgeschlagen");
    }

    await fetchUser();
    window.location.href = "/lernen";
    return true;
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      throw new Error("Die Passwörter stimmen nicht überein");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      throw new Error(error.message || "Registrierung fehlgeschlagen");
    }

    return true;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    }
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
