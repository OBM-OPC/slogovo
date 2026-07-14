import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  welcome: vi.fn(async () => undefined),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async () => ({ data: [{ allowed: true, remaining: 2, retry_after_seconds: 60 }], error: null }),
    auth: { signUp: mocks.signUp },
  }),
}));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: mocks.welcome }));
vi.mock("@/lib/timing", () => ({ minimumResponseTime: async () => undefined }));

import { POST } from "./route";

function request() {
  return new Request("https://slogovo.test/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.1" },
    body: JSON.stringify({
      name: "Test User",
      email: "person@example.com",
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
    }),
  });
}

describe("registration enumeration resistance", () => {
  beforeEach(() => {
    mocks.signUp.mockReset();
    mocks.welcome.mockClear();
  });

  it("returns the same status and shape for a new and existing email", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { user: { id: "new-user", identities: [{ id: "identity" }] } },
      error: null,
    });
    const created = await POST(request());
    const createdBody = await created.json();

    mocks.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });
    const existing = await POST(request());
    const existingBody = await existing.json();

    expect(created.status).toBe(202);
    expect(existing.status).toBe(202);
    expect(existingBody).toEqual(createdBody);
    expect(JSON.stringify(existingBody)).not.toMatch(/existiert bereits|already registered/i);
    expect(mocks.welcome).toHaveBeenCalledTimes(1);
  });
});
