import { describe, expect, it, vi } from "vitest";
import { consumeRateLimit, type RateLimitClient } from "./rate-limit";

describe("distributed rate limiting", () => {
  it("uses the database result and never sends the plaintext identity", async () => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
      void name;
      void args;
      return { data: [{ allowed: false, remaining: 0, retry_after_seconds: 42 }], error: null };
    });
    const result = await consumeRateLimit({ rpc } as RateLimitClient, "email:user@example.com", { scope: "login", limit: 5, windowSeconds: 600 });
    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 42, backend: "database" });
    const args = rpc.mock.calls[0]?.[1];
    expect(args.p_key_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(args)).not.toContain("user@example.com");
  });

  it("allows requests below the configured limit", async () => {
    const rpc = vi.fn(async () => ({ data: [{ allowed: true, remaining: 4, retry_after_seconds: 600 }], error: null }));
    await expect(consumeRateLimit({ rpc } as RateLimitClient, "ip:203.0.113.5", { scope: "login", limit: 5, windowSeconds: 600 })).resolves.toMatchObject({ allowed: true, remaining: 4 });
  });
});
