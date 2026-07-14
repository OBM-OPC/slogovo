import { clientIp } from "./request-security";
import { logEvent } from "./structured-log";

export interface RateLimitClient {
  rpc: (
    functionName: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface RateLimitRule {
  scope: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  backend: "database" | "local-fallback";
}

const fallbackCounters = new Map<string, { count: number; expiresAt: number }>();

async function hashIdentity(scope: string, identity: string): Promise<string> {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET ?? "slogovo-rate-limit-v1";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${scope}:${identity.trim().toLowerCase()}`)
  );
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function localFallback(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const current = fallbackCounters.get(key);
  const counter = !current || current.expiresAt <= now
    ? { count: 1, expiresAt: now + rule.windowSeconds * 1000 }
    : { count: current.count + 1, expiresAt: current.expiresAt };
  fallbackCounters.set(key, counter);
  if (fallbackCounters.size > 10_000) {
    for (const [candidate, value] of fallbackCounters) {
      if (value.expiresAt <= now) fallbackCounters.delete(candidate);
    }
  }
  return {
    allowed: counter.count <= rule.limit,
    remaining: Math.max(rule.limit - counter.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((counter.expiresAt - now) / 1000), 1),
    backend: "local-fallback",
  };
}

export async function consumeRateLimit(
  client: RateLimitClient,
  identity: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const keyHash = await hashIdentity(rule.scope, identity);
  const { data, error } = await client.rpc("consume_request_rate_limit", {
    p_key_hash: keyHash,
    p_scope: rule.scope,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });

  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row && typeof row === "object") {
    const result = row as Record<string, unknown>;
    return {
      allowed: result.allowed === true,
      remaining: Number(result.remaining ?? 0),
      retryAfterSeconds: Math.max(Number(result.retry_after_seconds ?? 1), 1),
      backend: "database",
    };
  }

  logEvent("rate_limit_backend_unavailable", {
    errorCode: "RATE_LIMIT_FALLBACK",
    scope: rule.scope,
  });
  return localFallback(keyHash, rule);
}

export async function enforceRateLimits(
  client: RateLimitClient,
  request: Request,
  checks: Array<{ identity: string; rule: RateLimitRule }>
): Promise<RateLimitResult> {
  let strictest: RateLimitResult = {
    allowed: true,
    remaining: Number.MAX_SAFE_INTEGER,
    retryAfterSeconds: 1,
    backend: "database",
  };
  for (const check of checks) {
    const result = await consumeRateLimit(client, check.identity, check.rule);
    if (!result.allowed) return result;
    if (result.remaining < strictest.remaining) strictest = result;
  }
  return strictest;
}

export function ipIdentity(request: Request): string {
  return `ip:${clientIp(request)}`;
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(result.retryAfterSeconds),
  };
}
