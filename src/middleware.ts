import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { contentSecurityPolicy, STATIC_SECURITY_HEADERS } from "@/lib/security-headers";
import { validateStateChangingRequest } from "@/lib/request-security";

const publicPages = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/demo",
  "/datenschutz",
  "/impressum",
]);

const publicApiRoutes = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const publicStaticPrefixes = ["/_next/", "/audio/", "/images/", "/fonts/"];

function isPublicPath(pathname: string): boolean {
  return publicPages.has(pathname)
    || publicApiRoutes.has(pathname)
    || pathname === "/favicon.ico"
    || publicStaticPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function withSessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

function secureResponse(response: NextResponse, csp: string, nonce: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Nonce", nonce);
  for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

function secureReplacement(
  source: NextResponse,
  target: NextResponse,
  csp: string,
  nonce: string
): NextResponse {
  return secureResponse(withSessionCookies(source, target), csp, nonce);
}

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("X-Nonce", nonce);
  const securedRequest = new NextRequest(request, { headers: requestHeaders });

  const requestFailure = validateStateChangingRequest(securedRequest);
  if (requestFailure) {
    return secureResponse(
      NextResponse.json({ error: "Ungültige Anfrage", code: requestFailure }, { status: 403 }),
      csp,
      nonce
    );
  }

  const { response, user } = await updateSession(securedRequest);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return secureResponse(response, csp, nonce);
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return secureReplacement(
        response,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        csp,
        nonce
      );
    }
    return secureReplacement(
      response,
      NextResponse.redirect(new URL("/login", request.url)),
      csp,
      nonce
    );
  }

  if (pathname === "/dashboard") {
    return secureReplacement(
      response,
      NextResponse.redirect(new URL("/lernen", request.url)),
      csp,
      nonce
    );
  }

  return secureResponse(response, csp, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
