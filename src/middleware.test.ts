import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { middleware } from "./middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const updateSessionMock = vi.mocked(updateSession);

function refreshedResponse() {
  const response = NextResponse.next();
  response.cookies.set("sb-session", "refreshed", { httpOnly: true });
  return response;
}

describe("authentication middleware", () => {
  beforeEach(() => {
    updateSessionMock.mockReset();
  });

  it("redirects an unverified protected-page request and preserves refreshed cookies", async () => {
    updateSessionMock.mockResolvedValue({ response: refreshedResponse(), user: null });

    const response = await middleware(new NextRequest("https://slogovo.test/lernen"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://slogovo.test/login");
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
  });

  it("returns 401 for an unverified protected API request", async () => {
    updateSessionMock.mockResolvedValue({ response: refreshedResponse(), user: null });

    const response = await middleware(
      new NextRequest("https://slogovo.test/api/progress/load")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("allows a protected request only after getUser returned a verified user", async () => {
    const response = refreshedResponse();
    updateSessionMock.mockResolvedValue({
      response,
      user: { id: "user-1" } as never,
    });

    await expect(
      middleware(new NextRequest("https://slogovo.test/lernen"))
    ).resolves.toBe(response);
  });

  it("does not make nested paths public and protects /api/auth/me", async () => {
    updateSessionMock.mockResolvedValue({ response: refreshedResponse(), user: null });
    expect((await middleware(new NextRequest("https://slogovo.test/login/admin"))).status).toBe(307);
    const me = await middleware(new NextRequest("https://slogovo.test/api/auth/me"));
    expect(me.status).toBe(401);
  });

  it("rejects cross-origin mutations before auth and emits CSP on responses", async () => {
    const response = await middleware(new NextRequest("https://slogovo.test/api/sync", {
      method: "POST",
      headers: { origin: "https://evil.test", "content-type": "application/json" },
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(updateSessionMock).not.toHaveBeenCalled();
  });
});
