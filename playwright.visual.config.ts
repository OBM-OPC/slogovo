import { defineConfig, devices } from "@playwright/test";

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/usr/bin/chromium";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /bulgarian-typography\.spec\.ts/,
  fullyParallel: true,
  workers: 1,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: localChromium },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], browserName: "firefox" },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run e2e:server",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
