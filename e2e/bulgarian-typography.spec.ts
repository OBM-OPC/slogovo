import { test, expect } from "@playwright/test";
import { loginViaApi, resetBackend } from "./helpers";

const ALPHABET_CHARS = "а б в г д и й п т ц ш щ ъ ю я";

async function getComputedLangStyles(page: import("@playwright/test").Page) {
  const sample = page.locator('[lang="bg"]').first();
  await expect(sample).toBeVisible();
  return sample.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      fontFeatureSettings: style.fontFeatureSettings,
      fontStyle: style.fontStyle,
      fontFamily: style.fontFamily,
    };
  });
}

test.describe("Bulgarian typography override", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetBackend(request);
    await loginViaApi(page);
  });

  test("alphabet page disables locl for Bulgarian text", async ({ page }) => {
    await page.goto("/alphabet");
    const styles = await getComputedLangStyles(page);

    expect(styles.fontStyle).toBe("normal");
    expect(styles.fontFeatureSettings).toContain('"locl" 0');

    const alphabet = page.locator('[lang="bg"]').filter({ hasText: /[абвгдийптцшщъюя]/ });
    await expect(alphabet.first()).toBeVisible();
  });

  test("typography fixture captures Bulgarian alphabet and words", async ({ page, browserName }) => {
    await page.goto("/alphabet");
    await page.waitForSelector('[lang="bg"]');

    const sample = page.locator('[lang="bg"]').filter({ hasText: /[абвгдийптцшщъюя]/ }).first();
    await expect(sample).toBeVisible();

    await page.screenshot({
      path: `test-results/bulgarian-glyphs/${browserName}-alphabet.png`,
      fullPage: false,
    });
  });
});

// Dedicated test for the representative character set listed in the issue.
test("representative Bulgarian characters render with lang bg", async ({ page, request }) => {
  await resetBackend(request);
  await loginViaApi(page);
  await page.goto("/alphabet");

  const representative = page.locator('[lang="bg"]').filter({ hasText: /[абвгдийптцшщъюя]/ });
  await expect(representative.first()).toBeVisible();

  const styles = await getComputedLangStyles(page);
  expect(styles.fontStyle).toBe("normal");
  expect(styles.fontFeatureSettings).toContain('"locl" 0');
});
