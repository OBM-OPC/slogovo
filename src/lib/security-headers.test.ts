import { afterEach, describe, expect, it, vi } from "vitest";
import { contentSecurityPolicy } from "./security-headers";

afterEach(() => vi.unstubAllEnvs());

describe("contentSecurityPolicy", () => {
  it("uses a nonce, blocks framing/plugins, and permits only the configured Supabase origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/rest/v1");
    const policy = contentSecurityPolicy("nonce-1");
    expect(policy).toContain("script-src 'self' 'nonce-nonce-1' 'strict-dynamic'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("connect-src 'self' https://project.supabase.co wss://project.supabase.co");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("does not upgrade loopback development assets to HTTPS", () => {
    vi.stubEnv("NODE_ENV", "development");
    const policy = contentSecurityPolicy("nonce-2");
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});
