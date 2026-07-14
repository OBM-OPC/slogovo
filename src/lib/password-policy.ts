export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "password1234",
  "passwort1234",
  "qwertyuiop12",
  "letmeinplease",
  "iloveyou1234",
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
