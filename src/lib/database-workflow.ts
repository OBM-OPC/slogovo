export interface MigrationSource {
  name: string;
  sql: string;
}

export interface DatabaseWorkflowIssue {
  migration: string;
  message: string;
}

const MIGRATION_NAME = /^(\d{14})_[a-z0-9_]+\.sql$/;
const DESTRUCTIVE_SQL = /\b(drop\s+(?:table|column)|truncate(?:\s+table)?|delete\s+from)\b/i;
const DESTRUCTIVE_MARKER = /--\s*destructive-change-reviewed:/i;

export function validateDatabaseWorkflow(
  migrations: MigrationSource[],
  generatedTypes: string
): DatabaseWorkflowIssue[] {
  const issues: DatabaseWorkflowIssue[] = [];
  const timestamps = new Set<string>();
  const sortedNames = migrations.map((migration) => migration.name).sort();
  if (migrations.some((migration, index) => migration.name !== sortedNames[index])) {
    issues.push({ migration: "supabase/migrations", message: "migration files are not processed in lexical timestamp order" });
  }

  for (const migration of migrations) {
    const match = migration.name.match(MIGRATION_NAME);
    if (!match) {
      issues.push({ migration: migration.name, message: "filename must use YYYYMMDDHHMMSS_description.sql" });
      continue;
    }
    if (timestamps.has(match[1])) {
      issues.push({ migration: migration.name, message: `duplicate migration timestamp ${match[1]}` });
    }
    timestamps.add(match[1]);
    if (DESTRUCTIVE_SQL.test(migration.sql) && !DESTRUCTIVE_MARKER.test(migration.sql)) {
      issues.push({
        migration: migration.name,
        message: "destructive SQL requires a destructive-change-reviewed marker and documented recovery plan",
      });
    }
  }

  const allSql = migrations.map((migration) => migration.sql).join("\n");
  const createdTables = [...allSql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.([a-z_]+)/gi)]
    .map((match) => match[1]);
  for (const table of new Set(createdTables)) {
    if (!new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(allSql)) {
      issues.push({ migration: table, message: "public table is missing RLS enablement" });
    }
    if (!generatedTypes.includes(`${table}: {`)) {
      issues.push({ migration: table, message: "public table is missing from generated database types" });
    }
  }

  for (const match of allSql.matchAll(/add\s+column\s+if\s+not\s+exists\s+([a-z_]+)/gi)) {
    const column = match[1];
    if (!generatedTypes.includes(`${column}:`)) {
      issues.push({ migration: column, message: "migrated column is missing from generated database types" });
    }
  }
  return issues;
}
