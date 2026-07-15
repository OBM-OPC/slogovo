import { expect, test, type Page, type Response } from "@playwright/test";
import { resetBackend, testPassword } from "./helpers";

type CspViolation = {
  blockedUri: string;
  directive: string;
  sourceFile: string;
};

const extensionNoise = /contentscript\.js|ObjectMultiplex|(?:chrome|moz)-extension:\/\//i;

test.skip(
  process.env.E2E_NEXT_MODE !== "start",
  "Rendered nonce assertions require the production Next.js renderer"
);

async function assertMatchingScriptNonces(page: Page, response: Response) {
  const headers = response.headers();
  const csp = headers["content-security-policy"] ?? "";
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1];

  expect(nonce, "document CSP must contain a nonce").toBeTruthy();
  expect(headers["x-nonce"]).toBe(nonce);

  const scripts = await page.locator("script").evaluateAll((nodes) => nodes.map((node) => ({
    nonce: (node as HTMLScriptElement).nonce,
    src: (node as HTMLScriptElement).src,
  })));
  expect(scripts.length, "Next.js must render framework scripts").toBeGreaterThan(0);
  expect(
    scripts.filter((script) => script.nonce !== nonce),
    "every rendered Next.js script must use the document CSP nonce"
  ).toEqual([]);

  return nonce as string;
}

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test("hydrates /login, authenticates, and emits no application CSP violations", async ({ page }) => {
  const violations: CspViolation[] = [];
  const cspConsoleErrors: string[] = [];

  await page.exposeFunction("__reportCspViolation", (violation: CspViolation) => {
    if (!extensionNoise.test(`${violation.blockedUri} ${violation.sourceFile}`)) {
      violations.push(violation);
    }
  });
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => {
      const report = (window as unknown as {
        __reportCspViolation: (violation: CspViolation) => void;
      }).__reportCspViolation;
      report({
        blockedUri: event.blockedURI,
        directive: event.effectiveDirective,
        sourceFile: event.sourceFile,
      });
    });
  });
  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error"
      && /content security policy|refused to (?:execute|load)/i.test(text)
      && !extensionNoise.test(text)
    ) {
      cspConsoleErrors.push(text);
    }
  });

  const loginResponse = await page.goto("/login");
  expect(loginResponse).not.toBeNull();
  const loginNonce = await assertMatchingScriptNonces(page, loginResponse!);

  await page.getByLabel("E-Mail").fill("learner@example.com");
  await page.getByLabel("Passwort", { exact: true }).fill(testPassword);
  const documentResponse = page.waitForResponse((response) => (
    response.request().resourceType() === "document"
    && new URL(response.url()).pathname === "/lernen"
  ));
  await page.getByRole("button", { name: "Anmelden" }).click();
  const learningResponse = await documentResponse;
  await expect(page).toHaveURL(/\/lernen$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Lernen" })).toBeVisible({ timeout: 15_000 });
  const learningNonce = await assertMatchingScriptNonces(page, learningResponse);

  expect(learningNonce).not.toBe(loginNonce);
  expect(violations).toEqual([]);
  expect(cspConsoleErrors).toEqual([]);
});
