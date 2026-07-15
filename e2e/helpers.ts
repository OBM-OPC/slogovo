import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

export const mockUrl = "http://127.0.0.1:54321";
export const testPassword = "Test-Passwort-2026";

export async function resetBackend(request: APIRequestContext) {
  const response = await request.post(`${mockUrl}/__test/reset`);
  expect(response.ok()).toBeTruthy();
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill("learner@example.com");
  await page.getByLabel("Passwort", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/lernen$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Lernen" })).toBeVisible({ timeout: 15_000 });
}

export async function loginViaApi(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "learner@example.com", password: testPassword },
    headers: { Origin: "http://127.0.0.1:3100" },
  });
  expect(response.ok(), `API login failed with ${response.status()}`).toBeTruthy();
}

export async function loginInContext(context: BrowserContext) {
  const page = await context.newPage();
  await login(page);
  return page;
}

export async function openFirstLesson(page: Page) {
  await page.goto("/kurs/a1-modul-1/a1-modul-1-lektion-1");
  await page.getByRole("button", { name: "Los geht's" }).click();
  await page.getByRole("button", { name: "Weiter zur Grammatik" }).click();
  await page.getByRole("button", { name: "Übungen starten" }).click();
}

export async function completeMatching(page: Page) {
  const pairs = [
    ["Guten Morgen", "Добро утро"],
    ["Gute Nacht", "Лека нощ"],
    ["Willkommen", "Добре дошли"],
    ["Auf Wiedersehen", "Довиждане"],
  ];
  for (const [index, [german, bulgarian]] of pairs.entries()) {
    await page.getByRole("button", { name: german, exact: true }).click();
    await page.getByRole("button", { name: bulgarian, exact: true }).click();
    await page.getByRole("button", { name: index === pairs.length - 1 ? "Fertig" : "Weiter" }).click();
  }
}

export function defaultProgressRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "00000000-0000-4000-8000-000000000001",
    streak_current: 0,
    streak_longest: 0,
    streak_last_study_date: null,
    completed_lessons: [],
    mastered_lessons: [],
    completed_modules: [],
    vocabulary_progress: {},
    lesson_scores: {},
    exercise_stats: { total: 0, correct: 0, wrong: 0, consecutiveCorrect: 0 },
    daily_stats: {},
    recorded_attempt_ids: [],
    settings: { dailyGoal: "medium", ttsEnabled: false, showLatin: true, speechRate: 0.9 },
    achievements: [],
    ...overrides,
  };
}
