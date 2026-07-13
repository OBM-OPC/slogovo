import { expect, test } from "@playwright/test";
import {
  completeMatching,
  defaultProgressRow,
  login,
  loginInContext,
  mockUrl,
  openFirstLesson,
  resetBackend,
} from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test("opens the adaptive daily session from the primary learning action", async ({ page }) => {
  await login(page);
  for (const area of ["Wiederholen", "Sprechen", "Fehler", "Wortschatz", "Fortschritt"]) {
    await expect(page.getByRole("link", { name: new RegExp(area) }).first()).toBeVisible();
  }
  await page.getByRole("link", { name: /Heute lernen/ }).click();

  await expect(page).toHaveURL(/\/heute-lernen$/);
  await expect(page.getByRole("heading", { name: "Heute lernen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Session starten" })).toBeEnabled();
  await expect(page.getByText("Adaptive Session")).toBeVisible();
  await expect(page.getByText("Sprechen", { exact: true })).toBeVisible();
});

test("starts a lesson, retries one failed item, passes, syncs, and restores on another device", async ({ page, browser, request }) => {
  await login(page);
  await openFirstLesson(page);

  await page.getByRole("button", { name: "Добро утро", exact: true }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Hallo", exact: true }).click();
  await page.getByRole("button", { name: "Fertig" }).click();
  await completeMatching(page);

  await expect(page.getByRole("heading", { name: "Fehler wiederholen" })).toBeVisible();
  await page.getByRole("button", { name: "Wiederholung starten" }).click();
  await page.getByPlaceholder("Antwort eingeben").fill("Добър ден");
  await page.getByRole("button", { name: "Prüfen" }).click();
  await page.getByRole("button", { name: "Fertig" }).click();

  await expect(page.getByRole("heading", { name: "Lektion bestanden!" })).toBeVisible();
  await expect.poll(async () => {
    const state = await (await request.get(`${mockUrl}/__test/state`)).json() as {
      progress: { completed_lessons?: string[] } | null;
      writes: Record<string, number>;
    };
    return {
      completed: state.progress?.completed_lessons?.includes("a1-modul-1-lektion-1") ?? false,
      attempts: state.writes.lesson_attempts ?? 0,
    };
  }, { timeout: 12_000 }).toEqual({ completed: true, attempts: 1 });

  const secondDevice = await browser.newContext();
  const secondPage = await loginInContext(secondDevice);
  await expect(secondPage.getByRole("link", { name: /Hallo & Abschiede 1\/5/ })).toBeVisible();
  await secondDevice.close();
});

test("fails a lesson after required retries are still wrong", async ({ page }) => {
  await login(page);
  await openFirstLesson(page);

  await page.getByRole("button", { name: "Добро утро", exact: true }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Gute Nacht", exact: true }).click();
  await page.getByRole("button", { name: "Fertig" }).click();
  await completeMatching(page);
  await page.getByRole("button", { name: "Wiederholung starten" }).click();

  for (let index = 0; index < 2; index += 1) {
    await page.getByPlaceholder("Antwort eingeben").fill("falsch");
    await page.getByRole("button", { name: "Prüfen" }).click();
    await page.getByRole("button", { name: "Fertig" }).click();
  }

  await page.getByRole("button", { name: "falsch", exact: true }).click();
  await page.getByRole("button", { name: "Fertig" }).click();
  await page.getByRole("button", { name: "falsch", exact: true }).click();
  await page.getByRole("button", { name: "Fertig" }).click();

  await expect(page.getByRole("heading", { name: "Noch nicht bestanden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Erneut versuchen" })).toBeVisible();
});

test("reviews due vocabulary and synchronizes the review event", async ({ page, request }) => {
  const seeded = defaultProgressRow({
    vocabulary_progress: {
      "m1l1-1": {
        status: "review",
        nextReview: "2026-01-01",
        lastReviewed: "2025-12-31",
        timesCorrect: 2,
        timesWrong: 0,
        intervalIndex: 1,
        easeFactor: 2.5,
      },
    },
  });
  expect((await request.post(`${mockUrl}/__test/progress`, { data: seeded })).ok()).toBeTruthy();

  await login(page);
  await page.goto("/vokabeln");
  await page.getByRole("button", { name: "Karten", exact: true }).click();
  await expect(page.getByText("Wiederholen").locator("..").getByText("1", { exact: true })).toBeVisible();
  await page.getByText("Hallo", { exact: true }).click();
  await page.getByRole("button", { name: "Gut", exact: true }).click();

  await expect.poll(async () => {
    const state = await (await request.get(`${mockUrl}/__test/state`)).json() as {
      writes: Record<string, number>;
    };
    return state.writes.vocabulary_review_events ?? 0;
  }, { timeout: 12_000 }).toBe(1);
});
