import { expect, test } from "@playwright/test";
import { login, mockUrl, resetBackend, testPassword } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test("registers a learner through the public form", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/register");
  await page.getByLabel("Name").fill("Neue Lernerin");
  await page.getByLabel("E-Mail").fill("new@example.com");
  await page.getByLabel("Passwort", { exact: true }).fill(testPassword);
  await page.getByLabel("Passwort bestätigen", { exact: true }).fill(testPassword);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("button", { name: "Konto erstellen" }).click();

  await expect(page.getByRole("heading", { name: "Anfrage erhalten" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zum Login" })).toBeVisible();
});

test("protects private routes and logs in with a server-side session", async ({ page }) => {
  await page.goto("/lernen");
  await expect(page).toHaveURL(/\/login$/);

  await login(page);
  const cookies = await page.context().cookies();
  const authCookies = cookies.filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
  expect(authCookies.length).toBeGreaterThan(0);
  expect(authCookies.every((cookie) => cookie.httpOnly)).toBeTruthy();
});

test("expires an invalid server session and redirects to login", async ({ page, request }) => {
  await login(page);
  expect((await request.post(`${mockUrl}/__test/expire`)).ok()).toBeTruthy();

  await page.goto("/profil");
  await expect(page).toHaveURL(/\/login$/);
});

test("logs out and cannot revisit a protected page", async ({ page }) => {
  await login(page);
  await page.goto("/profil");
  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/lernen");
  await expect(page).toHaveURL(/\/login$/);
});
