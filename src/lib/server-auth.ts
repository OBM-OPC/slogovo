import { NextRequest, NextResponse } from "next/server";
import { createClient, Session, User } from "@supabase/supabase-js";

export type ServerSession = Pick<Session, "access_token" | "refresh_token" | "expires_at" | "expires_in" | "token_type" | "user">;

export interface AuthResult {
  user: User | null;
  session: ServerSession | null;
  response: NextResponse | null;
  error: string | null;
  status: number;
}

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) {
    throw new Error(`Missing Supabase config: URL=${!!url}, KEY=${!!key}`);
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSessionFromCookie(request: NextRequest): ServerSession | null {
  const sessionCookie = request.cookies.get("sb-session")?.value;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie) as ServerSession;
  } catch {
    return null;
  }
}

export function setSessionCookies(response: NextResponse, session: ServerSession) {
  const secureCookie = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7;

  response.cookies.set("sb-session", JSON.stringify(session), {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  response.cookies.set("sb-token", JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }), {
    httpOnly: false,
    secure: secureCookie,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const session = getSessionFromCookie(request);
  if (!session?.access_token) {
    return { user: null, session: null, response: null, error: "Nicht authentifiziert", status: 401 };
  }

  const supabaseServer = getSupabaseServer();
  const { data: { user }, error: userError } = await supabaseServer.auth.getUser(session.access_token);

  if (!userError && user) {
    return { user, session, response: null, error: null, status: 200 };
  }

  if (!session.refresh_token) {
    return { user: null, session: null, response: null, error: "Ungültige Session", status: 401 };
  }

  const { data: refreshed, error: refreshError } = await supabaseServer.auth.refreshSession({
    refresh_token: session.refresh_token,
  });

  if (refreshError || !refreshed.session?.access_token || !refreshed.user) {
    return { user: null, session: null, response: null, error: "Session abgelaufen", status: 401 };
  }

  const refreshedSession = refreshed.session as ServerSession;
  const response = NextResponse.next();
  setSessionCookies(response, refreshedSession);

  return {
    user: refreshed.user,
    session: refreshedSession,
    response,
    error: null,
    status: 200,
  };
}

export function jsonWithAuthCookies<T>(body: T, auth: AuthResult, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  if (auth.session && auth.response) {
    setSessionCookies(response, auth.session);
  }
  return response;
}
