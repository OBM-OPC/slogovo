import { createClient, Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let supabaseBrowser: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (typeof window === "undefined") return null;
  if (!supabaseBrowser) {
    supabaseBrowser = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder",
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return supabaseBrowser;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (!match) return null;
  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

export async function restoreBrowserSession(): Promise<Session | null> {
  const raw = getCookie("sb-session");
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    const sb = getSupabaseBrowser();
    if (sb) {
      await sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
    return session;
  } catch {
    return null;
  }
}
