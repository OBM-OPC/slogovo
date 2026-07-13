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

test("keeps a Bulgarian typing flow usable on a narrow mobile viewport", async ({ page, request }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const seeded = defaultProgressRow({
    vocabulary_progress: {
      "m1l1-1": {
        status: "learning",
        nextReview: "2026-07-14",
        lastReviewed: "2026-07-13",
        timesCorrect: 0,
        timesWrong: 1,
        intervalIndex: 0,
        easeFactor: 2.5,
      },
    },
  });
  expect((await request.post(`${mockUrl}/__test/progress`, { data: seeded })).ok()).toBeTruthy();

  await login(page);
  await page.goto("/fehler");
  const input = page.getByRole("textbox", { name: "Bulgarische Übersetzung eingeben" });
  await expect(input).toBeVisible();
  await page.getByRole("button", { name: "Bulgarische Tastaturhilfe" }).click();
  await page.getByRole("button", { name: "ъ einfügen" }).click();
  await expect(input).toHaveValue("ъ");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("shows an honest empty progress state before learning events exist", async ({ page }) => {
  await login(page);
  await page.goto("/fortschritt");
  await expect(page.getByRole("heading", { name: "Dein Lernstand" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Noch keine Lernereignisse" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Heute lernen" })).toBeVisible();
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
