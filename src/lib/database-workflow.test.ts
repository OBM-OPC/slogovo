import { describe, expect, it } from "vitest";
import { validateDatabaseWorkflow } from "./database-workflow";

describe("database workflow validation", () => {
  it("accepts an additive typed RLS migration", () => {
    expect(validateDatabaseWorkflow([{
      name: "20260713120000_add_example.sql",
      sql: `
        create table if not exists public.example (id uuid primary key);
        alter table public.example enable row level security;
        alter table public.example add column if not exists device_id text;
      `,
    }], "example: {\ndevice_id: string;")).toEqual([]);
  });

  it("rejects destructive, untyped, and non-RLS changes", () => {
    const issues = validateDatabaseWorkflow([{
      name: "20260713120000_break_example.sql",
      sql: "create table if not exists public.example (id uuid); drop table public.old_data;",
    }], "");
    expect(issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
      expect.stringContaining("destructive SQL"),
      expect.stringContaining("missing RLS"),
      expect.stringContaining("missing from generated"),
    ]));
  });
});
