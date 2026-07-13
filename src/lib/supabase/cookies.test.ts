import { afterEach, describe, expect, it, vi } from "vitest";
import { secureAuthCookieOptions } from "./cookies";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("secureAuthCookieOptions", () => {
  it("forces Supabase session and refresh cookies to be HttpOnly", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(secureAuthCookieOptions({ httpOnly: false })).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });
});
