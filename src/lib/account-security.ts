import { z } from "zod";
import { PASSWORD_MAX_LENGTH } from "./password-policy";
import { passwordSchema } from "./validations";

export const currentPasswordSchema = z.string().min(1).max(PASSWORD_MAX_LENGTH);

export const sensitiveConfirmationSchema = z.object({
  currentPassword: currentPasswordSchema,
  confirmation: z.literal("LÖSCHEN"),
});

export const changePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: passwordSchema,
});

export const changeEmailSchema = z.object({
  currentPassword: currentPasswordSchema,
  newEmail: z.string().email().max(320),
});
