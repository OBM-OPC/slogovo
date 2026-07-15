import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createSessionResponse } from "./middleware";

describe("Supabase middleware response forwarding", () => {
  it("preserves nonce request overrides and every refreshed cookie across replacements", () => {
    const request = new NextRequest("https://slogovo.test/login", {
      headers: {
        "content-security-policy": "script-src 'self' 'nonce-one-nonce' 'strict-dynamic'",
        "x-nonce": "one-nonce",
      },
    });
    const first = createSessionResponse(request);
    first.cookies.set("sb-first", "first", { httpOnly: true });

    request.cookies.set("sb-first", "first");
    const replacement = createSessionResponse(request, first);
    replacement.cookies.set("sb-second", "second", { httpOnly: true });

    expect(replacement.headers.get("x-middleware-request-content-security-policy"))
      .toBe("script-src 'self' 'nonce-one-nonce' 'strict-dynamic'");
    expect(replacement.headers.get("x-middleware-request-x-nonce")).toBe("one-nonce");
    expect(replacement.cookies.get("sb-first")?.value).toBe("first");
    expect(replacement.cookies.get("sb-second")?.value).toBe("second");
  });
});
