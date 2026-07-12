import { createBrowserClient } from "@supabase/ssr";

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
  const { url, key } = getEnv();
  return createBrowserClient(url, key);
}
