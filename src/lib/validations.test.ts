import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema } from "./validations";

describe("password policy", () => {
  it("uses the same 12-128 boundary without composition rules", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@example.com", password: "all lowercase passphrase" }).success).toBe(true);
    expect(registerSchema.safeParse({ email: "a@example.com", password: "all lowercase passphrase", confirmPassword: "all lowercase passphrase" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "x".repeat(129), confirmPassword: "x".repeat(129) }).success).toBe(false);
  });
});
