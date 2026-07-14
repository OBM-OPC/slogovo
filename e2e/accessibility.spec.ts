import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login, resetBackend } from "./helpers";

const routes = [
  "/lernen", "/kurs", "/wiederholen", "/fortschritt", "/profil", "/erfolge", "/einstellungen",
  "/onboarding", "/alphabet", "/grammatik", "/vokabeln", "/sprechen", "/fehler", "/heute-lernen",
];

test.beforeEach(async ({ request }) => { await resetBackend(request); });

test("has no automated WCAG A/AA violations across learning screens", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  const violations: Array<{ route: string; id: string; impact: string | null | undefined; nodes: Array<Array<string>> }> = [];
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").last()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    violations.push(...results.violations.map((violation) => ({ route, id: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => node.target as string[]) })));
  }
  expect(violations).toEqual([]);
});
