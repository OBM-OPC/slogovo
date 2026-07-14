import { z } from "zod";
import { isCommonPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen haben`)
  .max(PASSWORD_MAX_LENGTH, `Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen haben`)
  .refine((password) => !isCommonPassword(password), "Dieses Passwort ist zu häufig verwendet");

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben").optional(),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
