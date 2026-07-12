import { createBrowserClient } from "@supabase/ssr";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // During static build or when env is missing, return placeholder values
    // so the client can be created without throwing. Actual auth calls will fail
    // gracefully at runtime if the env is still missing.
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
