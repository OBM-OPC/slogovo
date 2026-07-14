import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { readJsonBody, RequestBodyError, validateStateChangingRequest } from "./request-security";

describe("request security", () => {
  it("accepts same-origin JSON and rejects missing/cross-origin/form requests", () => {
    const valid = new NextRequest("https://slogovo.test/api/sync", { method: "POST", headers: { origin: "https://slogovo.test", "content-type": "application/json" } });
    expect(validateStateChangingRequest(valid)).toBeNull();
    expect(validateStateChangingRequest(new NextRequest("https://slogovo.test/api/sync", { method: "POST", headers: { "content-type": "application/json" } }))).toBe("origin_required");
    expect(validateStateChangingRequest(new NextRequest("https://slogovo.test/api/sync", { method: "POST", headers: { origin: "https://evil.test", "content-type": "application/json" } }))).toBe("origin_rejected");
    expect(validateStateChangingRequest(new NextRequest("https://slogovo.test/api/sync", { method: "POST", headers: { origin: "https://slogovo.test", "content-type": "application/x-www-form-urlencoded" } }))).toBe("json_content_type_required");
  });

  it("enforces byte and nesting limits before route schemas", async () => {
    await expect(readJsonBody(new Request("https://slogovo.test", { method: "POST", body: JSON.stringify({ value: "too large" }) }), 4)).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
    let deep: unknown = "leaf";
    for (let index = 0; index < 22; index += 1) deep = { deep };
    await expect(readJsonBody(new Request("https://slogovo.test", { method: "POST", body: JSON.stringify(deep) }))).rejects.toBeInstanceOf(RequestBodyError);
  });
});
