import { expect, test } from "@playwright/test";
import { loginViaApi, resetBackend } from "./helpers";

const routes = [
  "/lernen", "/kurs", "/wiederholen", "/fortschritt", "/profil", "/erfolge", "/einstellungen",
  "/onboarding", "/alphabet", "/grammatik", "/vokabeln", "/sprechen", "/fehler", "/heute-lernen",
];

test.beforeEach(async ({ request }) => { await resetBackend(request); });

async function openRoute(page: Parameters<typeof loginViaApi>[0], route: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const interrupted = error instanceof Error && error.message.includes("interrupted by another navigation");
      if (!interrupted || attempt === 2) throw error;
      await page.waitForLoadState("domcontentloaded");
    }
  }
}

test("keeps every learning screen thumb-friendly without horizontal overflow", async ({ page }) => {
  test.setTimeout(90_000);
  await loginViaApi(page);
  for (const route of routes) {
    await openRoute(page, route);
    await expect(page.locator("main").last()).toBeVisible();
    await expect(page.locator("h1").first(), `${route} did not finish rendering`).toBeVisible({ timeout: 15_000 });
    const audit = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const selector = "button, input, select, textarea, summary, [role='button'], nav a";
      const undersized = [...document.querySelectorAll<HTMLElement>(selector)]
        .filter((element) => {
          const style = getComputedStyle(element);
          const target = element instanceof HTMLInputElement && ["radio", "checkbox"].includes(element.type) ? element.closest("label") ?? element : element;
          const rect = target.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .map((element) => ({ tag: element.tagName, label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 50), rect: element.getBoundingClientRect().toJSON() }));
      return { overflow, undersized };
    });
    expect(audit.overflow, `${route} has horizontal overflow`).toBe(false);
    expect(audit.undersized, `${route} has undersized controls`).toEqual([]);
  }
});
