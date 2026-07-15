import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { secureAuthCookieOptions } from "./cookies";

export function createSessionResponse(request: NextRequest, previous?: NextResponse) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  for (const cookie of previous?.cookies.getAll() ?? []) {
    response.cookies.set(cookie);
  }

  return response;
}

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { url: "https://placeholder.supabase.co", key: "placeholder" };
  }
  return { url, key };
}

export async function updateSession(request: NextRequest) {
  let response = createSessionResponse(request);

  const { url, key } = getEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        const secured = secureAuthCookieOptions(options);
        request.cookies.set({ name, value, ...secured });
        response = createSessionResponse(request, response);
        response.cookies.set({ name, value, ...secured });
      },
      remove(name: string, options: CookieOptions) {
        const secured = secureAuthCookieOptions(options);
        request.cookies.set({ name, value: "", ...secured });
        response = createSessionResponse(request, response);
        response.cookies.set({ name, value: "", ...secured });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
