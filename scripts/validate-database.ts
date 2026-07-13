import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { validateDatabaseWorkflow } from "@/lib/database-workflow";

async function main() {
  const root = process.cwd();
  const migrationDirectory = path.join(root, "supabase", "migrations");
  const names = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const migrations = await Promise.all(names.map(async (name) => ({
    name,
    sql: await readFile(path.join(migrationDirectory, name), "utf8"),
  })));
  const generatedTypes = await readFile(
    path.join(root, "src", "types", "database.generated.ts"),
    "utf8"
  );
  const issues = validateDatabaseWorkflow(migrations, generatedTypes);
  if (issues.length > 0) {
    for (const issue of issues) {
      // eslint-disable-next-line no-console
      console.error(`${issue.migration}: ${issue.message}`);
    }
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`Validated ${migrations.length} ordered migration(s): additive/destructive policy, RLS, and generated types are consistent.`);
}

void main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
