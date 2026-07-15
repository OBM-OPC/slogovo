import { expect, test } from "@playwright/test";
import { login, mockUrl, resetBackend } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test("accepts only authenticated privacy-safe telemetry", async ({ page, request }) => {
  await login(page);
  const safeEvent = {
    id: "00000000-0000-4000-8000-000000000099",
    category: "learning",
    name: "lesson_started",
    timestamp: "2026-07-13T18:00:00.000Z",
    properties: { lessonId: "a1-modul-1-lektion-1", moduleId: "a1-modul-1" },
  };
  const headers = { origin: new URL(page.url()).origin };

  const accepted = await page.request.post("/api/telemetry", { headers, data: { events: [safeEvent] } });
  expect(accepted.status()).toBe(200);
  await expect.poll(async () => {
    const state = await (await request.get(`${mockUrl}/__test/state`)).json() as { writes: Record<string, number> };
    return state.writes.telemetry_events ?? 0;
  }).toBe(1);

  const rejected = await page.request.post("/api/telemetry", {
    headers,
    data: { events: [{ ...safeEvent, id: "00000000-0000-4000-8000-000000000100", properties: { email: "private@example.com" } }] },
  });
  expect(rejected.status()).toBe(400);
});
