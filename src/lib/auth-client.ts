export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  displayName: string | null;
  bio: string | null;
}

interface AuthResponse {
  user?: AuthenticatedUser;
  error?: string;
}

async function readResponse(response: Response): Promise<AuthResponse> {
  const body = (await response.json().catch(() => ({}))) as AuthResponse;
  if (!response.ok) {
    throw new Error(body.error || "Authentifizierung fehlgeschlagen");
  }
  return body;
}

export async function fetchAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) return null;
  const body = await readResponse(response);
  return body.user ?? null;
}

export async function loginWithPassword(email: string, password: string): Promise<void> {
  await readResponse(
    await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function registerWithPassword(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  await readResponse(
    await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    })
  );
}

export async function logoutSession(): Promise<void> {
  await readResponse(
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    })
  );
}
