import { NextRequest } from "next/server";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_MAX_JSON_DEPTH = 20;

export type RequestSecurityFailure =
  | "origin_required"
  | "origin_rejected"
  | "json_content_type_required";

function configuredOrigins(request: NextRequest): Set<string> {
  const origins = new Set([request.nextUrl.origin]);
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      // Invalid deployment configuration must not broaden the allowlist.
    }
  }
  return origins;
}

export function validateStateChangingRequest(request: NextRequest): RequestSecurityFailure | null {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase()) || !request.nextUrl.pathname.startsWith("/api/")) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) return "origin_required";
  if (!configuredOrigins(request).has(origin)) return "origin_rejected";

  if (request.method.toUpperCase() !== "DELETE" && request.nextUrl.pathname !== "/api/auth/logout") {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return "json_content_type_required";
  }
  return null;
}

function jsonDepth(value: unknown, depth = 0): number {
  if (depth > DEFAULT_MAX_JSON_DEPTH) return depth;
  if (Array.isArray(value)) {
    return value.reduce((max, item) => Math.max(max, jsonDepth(item, depth + 1)), depth);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).reduce(
      (max, item) => Math.max(max, jsonDepth(item, depth + 1)),
      depth
    );
  }
  return depth;
}

export class RequestBodyError extends Error {
  constructor(
    readonly code: "BODY_TOO_LARGE" | "INVALID_JSON" | "JSON_TOO_DEEP"
  ) {
    super(code);
    this.name = "RequestBodyError";
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES
): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError("BODY_TOO_LARGE");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestBodyError("BODY_TOO_LARGE");
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new RequestBodyError("INVALID_JSON");
  }
  if (jsonDepth(value) > DEFAULT_MAX_JSON_DEPTH) {
    throw new RequestBodyError("JSON_TOO_DEEP");
  }
  return value;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}
