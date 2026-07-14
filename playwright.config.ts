import { defineConfig, devices } from "@playwright/test";

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/usr/bin/chromium";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /mobile-audit\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.CI ? {} : { executablePath: localChromium },
      },
    },
    {
      name: "mobile-chrome",
      testMatch: /mobile-audit\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        launchOptions: process.env.CI ? {} : { executablePath: localChromium },
      },
    },
    {
      name: "mobile-webkit",
      testMatch: /mobile-audit\.spec\.ts/,
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run e2e:server",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
