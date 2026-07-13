import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/api/auth/me",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) =>
      pathname === path || pathname.startsWith(path + "/") || pathname.startsWith("/_next")
  );
}

function withSessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return response;
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(
        response,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    return withSessionCookies(
      response,
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  if (pathname === "/dashboard") {
    return withSessionCookies(
      response,
      NextResponse.redirect(new URL("/lernen", request.url))
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
