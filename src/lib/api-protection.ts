import { NextResponse } from "next/server";
import {
  enforceRateLimits,
  rateLimitHeaders,
  type RateLimitClient,
  type RateLimitRule,
} from "./rate-limit";
import { logEvent } from "./structured-log";

export const RATE_LIMITS = {
  loginIp: { scope: "auth_login_ip", limit: 10, windowSeconds: 10 * 60 },
  loginEmail: { scope: "auth_login_email", limit: 5, windowSeconds: 10 * 60 },
  registerIp: { scope: "auth_register_ip", limit: 3, windowSeconds: 60 * 60 },
  forgotIp: { scope: "auth_forgot_ip", limit: 5, windowSeconds: 60 * 60 },
  forgotEmail: { scope: "auth_forgot_email", limit: 3, windowSeconds: 60 * 60 },
  resetIp: { scope: "auth_reset_ip", limit: 5, windowSeconds: 60 * 60 },
  ttsIp: { scope: "tts_ip", limit: 50, windowSeconds: 60 * 60 },
  ttsUser: { scope: "tts_user", limit: 30, windowSeconds: 60 * 60 },
  syncIp: { scope: "sync_ip", limit: 120, windowSeconds: 60 },
  syncUser: { scope: "sync_user", limit: 120, windowSeconds: 60 },
  progressUser: { scope: "progress_user", limit: 120, windowSeconds: 60 },
  telemetryUser: { scope: "telemetry_user", limit: 120, windowSeconds: 60 },
  accountSensitive: { scope: "account_sensitive", limit: 10, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export async function rateLimitRequest(
  client: RateLimitClient,
  request: Request,
  checks: Array<{ identity: string; rule: RateLimitRule }>
): Promise<NextResponse | null> {
  const result = await enforceRateLimits(client, request, checks);
  if (result.allowed) return null;

  logEvent("rate_limit_exceeded", {
    errorCode: "RATE_LIMIT_EXCEEDED",
    reason: checks[0]?.rule.scope ?? "unknown",
  });
  return NextResponse.json(
    { error: "Zu viele Anfragen. Bitte versuche es später erneut.", code: "RATE_LIMIT_EXCEEDED" },
    { status: 429, headers: rateLimitHeaders(result) }
  );
}

export function rateLimitClient(client: unknown): RateLimitClient {
  return client as RateLimitClient;
}
