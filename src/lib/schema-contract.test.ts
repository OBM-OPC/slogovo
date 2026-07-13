import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("progress schema contract", () => {
  it("keeps API, migration, canonical schema, and generated types aligned", () => {
    const migration = read("supabase/migrations/20260713120000_add_progress_foundation_columns.sql");
    const canonical = read("supabase/progress-schema.sql");
    const generated = read("src/types/database.generated.ts");
    const loadRoute = read("src/app/api/progress/load/route.ts");
    const saveRoute = read("src/app/api/progress/save/route.ts");

    for (const column of ["mastered_lessons", "lesson_scores", "recorded_attempt_ids"]) {
      expect(migration).toContain(column);
      expect(canonical).toContain(column);
      expect(generated).toContain(column);
      expect(loadRoute).toContain(column);
      expect(saveRoute).toContain(column);
    }
    expect(migration).toContain("not c.relrowsecurity");
  });
});
