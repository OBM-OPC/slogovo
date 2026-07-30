import { test, expect } from "@playwright/test";
import { loginViaApi, resetBackend } from "./helpers";

async function getComputedLangStyles(page: import("@playwright/test").Page) {
  const sample = page.locator("[lang='bg']").first();
  await expect(sample).toBeVisible();
  return sample.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      fontFamily: style.fontFamily,
      fontStyle: style.fontStyle,
    };
  });
}

test.describe("Bulgarian sans-serif font override", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetBackend(request);
    await loginViaApi(page);
  });

  test("alphabet page renders Bulgarian text in the sans font stack", async ({ page }) => {
    await page.goto("/alphabet");
    const styles = await getComputedLangStyles(page);

    expect(styles.fontStyle).toBe("normal");
    expect(styles.fontFamily).not.toMatch(/Lora/i);
    expect(styles.fontFamily).not.toMatch(/Noto Serif/i);
    expect(styles.fontFamily).not.toMatch(/Georgia/i);

    const alphabet = page.locator("[lang='bg']").filter({ hasText: /[абвгдийптцшщъюя]/ });
    await expect(alphabet.first()).toBeVisible();
  });

  test("representative Bulgarian characters render with lang bg", async ({ page, request }) => {
    await resetBackend(request);
    await loginViaApi(page);
    await page.goto("/alphabet");

    const representative = page.locator("[lang='bg']").filter({ hasText: /[абвгдийптцшщъюя]/ });
    await expect(representative.first()).toBeVisible();

    const styles = await getComputedLangStyles(page);
    expect(styles.fontStyle).toBe("normal");
    expect(styles.fontFamily).not.toMatch(/Lora/i);
    expect(styles.fontFamily).not.toMatch(/Noto Serif/i);
    expect(styles.fontFamily).not.toMatch(/Georgia/i);
  });

  test("typography fixture captures Bulgarian alphabet and words", async ({ page, browserName }) => {
    await page.goto("/alphabet");
    await page.waitForSelector("[lang='bg']");

    const sample = page.locator("[lang='bg']").filter({ hasText: /[абвгдийптцшщъюя]/ }).first();
    await expect(sample).toBeVisible();

    await page.screenshot({
      path: `test-results/bulgarian-glyphs/${browserName}-alphabet.png`,
      fullPage: false,
    });
  });
});
