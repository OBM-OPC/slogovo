# Database migration and type workflow

## Rules

1. Create a new timestamped file in `supabase/migrations/`; never edit a migration that may have
   reached a shared environment and never edit production tables manually.
2. Prefer additive, nullable/default-backed changes. Existing learner progress must remain readable
   during deployment and rollback.
3. Document data backfills, lock/runtime risk, RLS impact, and recovery in the migration comments and
   pull request. Destructive SQL is exceptional and must include
   `-- destructive-change-reviewed: <owner-approved recovery reference>`.
4. Enable RLS and add least-privilege ownership policies in the same migration that creates a public
   user-data table. Re-verify existing policies when a new write path is added.
5. Update `src/types/database.generated.ts` in the same commit. Run `npm run validate:database` and
   the full validation suite before pushing.

## Local and staging workflow

Use a local or disposable staging Supabase project—never production—for iteration:

```bash
supabase db reset
supabase migration up --local
supabase gen types typescript --local > src/types/database.generated.ts
npm run validate:database
npm run type-check
npm test
```

When a linked non-production project is explicitly available, generate types with
`supabase gen types typescript --linked`. Review the diff; generated types must not be copied from an
unrelated project.

Verify after applying in staging:

- migration history contains the expected timestamp exactly once;
- old and new progress rows load successfully;
- backfill counts and null/default assumptions match the written plan;
- every public user-data table has RLS enabled and only owner-scoped policies;
- anonymous cross-user reads/writes fail;
- application smoke tests and sync duplicate/retry tests pass.

## Backfills and compatibility

Backfills must be idempotent and restartable. Prefer a safe default in the schema migration, then a
bounded/batched data update when row count makes a single transaction risky. Record expected row
counts and a verification query. Do not delete an old column until all deployed application versions
stop reading it and the owner approves the destructive follow-up.

## Recovery

Production rollback is owner-controlled. Prefer a forward-fix migration because an already-applied
migration file cannot be safely rewritten. For a failed additive change, stop the rollout, preserve
the old read path, and add a corrective migration. For destructive or corrupting changes, stop and
request the owner’s backup/PITR restore decision; never run restore, truncation, or data deletion
automatically.

The migrations `20260713170000_add_sync_device_ids.sql` and
`20260713190000_add_answer_feedback_status.sql` are additive and preserve existing rows. Their
production application is intentionally excluded from this backlog PR and requires explicit owner
release approval.
