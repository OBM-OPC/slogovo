import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("progress schema contract", () => {
  it("keeps API, migration, canonical schema, and generated types aligned", () => {
    const baseMigration = read("supabase/migrations/20260712000000_create_user_progress.sql");
    const migration = read("supabase/migrations/20260713120000_add_progress_foundation_columns.sql");
    const attemptsMigration = read("supabase/migrations/20260712130000_add_lesson_attempts.sql");
    const hardeningMigration = read("supabase/migrations/20260713130000_harden_database_functions.sql");
    const canonical = read("supabase/progress-schema.sql");
    const generated = read("src/types/database.generated.ts");
    const loadRoute = read("src/app/api/progress/load/route.ts");
    const saveRoute = read("src/app/api/progress/save/route.ts");

    for (const column of ["mastered_lessons", "lesson_scores", "recorded_attempt_ids"]) {
      expect(baseMigration).toContain(column);
      expect(migration).toContain(column);
      expect(canonical).toContain(column);
      expect(generated).toContain(column);
      expect(loadRoute).toContain(column);
      expect(saveRoute).toContain(column);
    }

    expect(baseMigration).toContain("enable row level security");
    expect(baseMigration).toContain("auth.uid() = user_id");
    expect(migration).toContain("not c.relrowsecurity");
    expect(attemptsMigration).toContain("security invoker");
    expect(attemptsMigration).toContain("set search_path = pg_catalog, public");
    expect(hardeningMigration).toContain("revoke all on function public.set_updated_at()");
    expect(hardeningMigration).toContain("public.rls_auto_enable()");
  });
});
