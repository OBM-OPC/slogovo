import { createClient } from "@supabase/supabase-js";
import { User, StoredUser, LoginCredentials, RegisterCredentials } from "@/types/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Server-side Supabase client
export const supabaseServer = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseKey || "placeholder", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Hash a string using SHA-256 (for local password storage fallback)
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const USERS_KEY = "slogovo_users";
const SESSION_KEY = "slogovo_session";

// Load stored users from localStorage
function loadUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): { user: User } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user }));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function registerUser(creds: RegisterCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = loadUsers();
  const existing = Object.values(users).find((u) => u.user.email.toLowerCase() === creds.email.toLowerCase());
  if (existing) {
    return { success: false, error: "Ein Account mit dieser E-Mail existiert bereits." };
  }

  const user: User = {
    id: generateId(),
    email: creds.email.toLowerCase().trim(),
    displayName: creds.displayName.trim(),
    createdAt: new Date().toISOString(),
    provider: "local",
  };

  const passwordHash = await sha256(creds.password);
  users[user.id] = { user, passwordHash };
  saveUsers(users);
  setSession(user);
  return { success: true, user };
}

export async function loginUser(creds: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = loadUsers();
  const stored = Object.values(users).find((u) => u.user.email.toLowerCase() === creds.email.toLowerCase());
  if (!stored) {
    return { success: false, error: "E-Mail oder Passwort ist falsch." };
  }
  const passwordHash = await sha256(creds.password);
  if (passwordHash !== stored.passwordHash) {
    return { success: false, error: "E-Mail oder Passwort ist falsch." };
  }
  setSession(stored.user);
  return { success: true, user: stored.user };
}

export async function googleLogin(): Promise<{ success: boolean; user?: User; error?: string }> {
  const id = generateId();
  const user: User = {
    id,
    email: `user-${id}@gmail.com`,
    displayName: "Google User",
    createdAt: new Date().toISOString(),
    provider: "google",
  };
  setSession(user);
  return { success: true, user };
}

export function logoutUser(): void {
  setSession(null);
}

export function getCurrentUser(): User | null {
  const session = getSession();
  return session?.user ?? null;
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const users = loadUsers();
  const stored = Object.values(users).find((u) => u.user.email.toLowerCase() === email.toLowerCase());
  if (!stored) {
    return { success: false, error: "Es wurde kein Account mit dieser E-Mail gefunden." };
  }
  return { success: true };
}

// Supabase helpers for server routes
export async function getCurrentUserFromSupabase(token?: string) {
  if (!token) return null;

  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;

  return user;
}
