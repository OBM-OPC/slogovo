import type { CookieOptions } from "@supabase/ssr";

/**
 * Slogovo never reads Supabase sessions in browser JavaScript. Keeping all auth
 * cookies HttpOnly prevents refresh tokens from being exposed to injected code.
 */
export function secureAuthCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
