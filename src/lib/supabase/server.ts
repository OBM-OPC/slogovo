import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { secureAuthCookieOptions } from "./cookies";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return {
      url: "https://placeholder.supabase.co",
      key: "placeholder",
    };
  }
  return { url, key };
}

export function createClient() {
  const cookieStore = cookies();
  const { url, key } = getEnv();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...secureAuthCookieOptions(options) });
        } catch {
          // The `set` method was called from a Server Component.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...secureAuthCookieOptions(options) });
        } catch {
          // see set comment.
        }
      },
    },
  });
}
