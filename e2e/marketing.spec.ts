import { expect, test } from "@playwright/test";

test("completes the no-account demo on a 320px mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/demo");

  for (let card = 1; card <= 5; card += 1) {
    await expect(page.getByText(`${card} / 5`)).toBeVisible();
    await page.getByRole("button", { name: "Bedeutung zeigen" }).click();
    await page.getByRole("button", { name: card === 5 ? /Weiter zur Hörübung/ : /Nächstes Wort/ }).click();
  }

  await page.getByRole("button", { name: "Phrase anhören" }).click();
  await page.getByRole("button", { name: "Guten Morgen" }).click();
  await expect(page.getByText(/Die richtige Antwort ist „Danke“/)).toBeVisible();
  await page.getByRole("button", { name: "Danke" }).click();
  await page.getByRole("button", { name: /Weiter zur Zuordnung/ }).click();

  for (const [bulgarian, german] of [["Здравей", "Hallo"], ["Моля", "Bitte"], ["Довиждане", "Auf Wiedersehen"]]) {
    await page.getByRole("button", { name: bulgarian }).click();
    await page.getByRole("button", { name: german }).click();
  }

  await expect(page.getByRole("heading", { name: /Du hast fünf Wörter kennengelernt/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lernweg kostenlos starten/ })).toHaveAttribute("href", "/register");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
