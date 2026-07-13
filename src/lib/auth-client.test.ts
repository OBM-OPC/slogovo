import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAuthenticatedUser,
  loginWithPassword,
  logoutSession,
  registerWithPassword,
} from "./auth-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("server-routed browser authentication", () => {
  it("loads the verified server user without reading browser auth cookies", async () => {
    const user = {
      id: "user-1",
      email: "learner@example.com",
      name: "Learner",
      image: null,
      displayName: null,
      bio: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAuthenticatedUser()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("treats an unauthenticated server response as no user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(fetchAuthenticatedUser()).resolves.toBeNull();
  });

  it("routes login, registration, and logout through same-origin APIs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await loginWithPassword("a@example.com", "Password1");
    await registerWithPassword("A", "a@example.com", "Password1", "Password1");
    await logoutSession();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/auth/login",
      expect.objectContaining({ method: "POST", credentials: "same-origin" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/register",
      expect.objectContaining({ method: "POST", credentials: "same-origin" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "same-origin" })
    );
  });

  it("surfaces the server-safe error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Ungültige Anmeldung" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(loginWithPassword("a@example.com", "wrong")).rejects.toThrow(
      "Ungültige Anmeldung"
    );
  });
});
