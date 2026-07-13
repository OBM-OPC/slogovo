# Slogovo controlled-development status

Last updated: 2026-07-13 10:55 UTC

## Run state

- Current branch: `feat/milestone-1-content-validation`
- Current implementation commit: `c727109797d9c606db1169fece08d1e5f57c9325`
- Remote branches inspected at preflight: `main` only; the single implementation branch was subsequently pushed
- Open pull requests inspected at preflight: none; pull request #92 is now the single open implementation PR
- Latest completed GitHub Actions result at preflight: CI succeeded for `main` commit `82d162a` (run `29240841319`)
- Pull request CI: run `29244368932` is in progress for implementation commit `c727109`
- Concurrent-run check: no additional worktree, Git lock, visible Slogovo session, or Slogovo coding process found
- Vercel status: production deployment for `main` commit `82d162a` succeeded; preview deployment `5423141669` was created for implementation commit `c727109` and is pending
- Supabase status: local migrations were inspected; no Supabase CLI is available for a remote status check, and no production migration, data, environment, or secret action was performed

## Backlog audit

All 19 open issues were inspected: #71, #70, #69, #68, #67, #66, #65, #64, #63, #62, #61, #35, #34, #33, #32, #31, #30, #29, and #28.

Priority order for the current program:

1. #71 — explicitly designated as the first assignment and spans the Phase 1/2 learning foundation.
2. #28 and #29 — tightly coupled Phase 1/2 trackers required by #71.
3. #70, #67, #68, #65, and #66 — workflow, database, architecture, and testing safeguards that support later phases.
4. #30–#35 and #61–#69 — later product phases and cross-cutting work, blocked on the learning foundation where applicable.

## Selected milestone

Selected issues: #71, #28, and #29.

Reasoning: #71 is the repository's explicit first milestone. The merged code already contains most Phase 1/2 domain foundations, but the content-validation contract is incomplete: the requested `npm run validate:content` command is missing, production builds do not run validation automatically, and validation only traverses content imported into the registry, allowing an unregistered JSON file to bypass checks. Closing that gap is the smallest coherent, high-priority increment that strengthens both content correctness and trustworthy lesson scoring inputs.

Scope for this increment:

- Document the current content, lesson, scoring, completion, XP, streak, active-time, mastery, and persistence data flow.
- Make validation discover every `content/**/meta.json` and `content/**/lessons/*.json` file from the filesystem.
- Detect filesystem/registry drift so unregistered or unexpectedly registered content fails validation.
- Add the requested `validate:content` command and make production builds run it automatically.
- Add tests for the filesystem-content inventory and retain the existing proof that all-wrong attempts cannot pass.

Out of scope:

- UI redesign, later learning phases, production database changes, environment changes, issue closure, merge, and deployment.

Dependencies:

- Existing content registry in `src/lib/content.ts`.
- Existing domain models in `src/types/learning.ts`, evaluation in `src/lib/evaluation.ts`, and attempts in `src/lib/lesson-attempts.ts`.

Risks:

- Filesystem validation must remain runnable in Node without leaking server-only modules into browser bundles.
- Existing content inconsistencies may surface as failures; fixes must stay limited to objective schema/registry defects.
- The build hook must not recursively call `next build` or duplicate expensive validation in CI.

Acceptance criteria for this increment:

- `npm run validate:content` inspects every course meta and lesson JSON file and exits non-zero on validation errors or registry drift.
- `npm run build` invokes content validation before the Next.js build.
- Automated tests cover content discovery and registry-drift detection.
- Existing scoring tests continue to prove an all-wrong learner cannot pass.
- Type-check, lint, unit tests, content validation, and production build pass.
- One branch and one reviewable pull request are used; CI must be green before requesting human review.

## Architecture audit

- Course content: JSON under `content/<level>/module-*/`, with module metadata and lesson JSON manually imported into `src/lib/content.ts`.
- Lesson flow: the lesson page loads registry content, `LessonView` sequences intro/vocabulary/grammar/exercises, and each exercise component returns a structured `ExerciseResult` through `ExerciseEngine`.
- Correctness preservation: item-level correctness is created by `buildExerciseItemResult`, aggregated by `buildExerciseResult`, and retained in `LessonAttempt.results`. Older click-through behavior has been replaced in the current lesson path.
- Pass/scoring: `calculateLessonMetrics` scores first attempts; `evaluateLessonOutcome` enforces completion, threshold, required items, and productive work; `createLessonAttempt` records pass/mastery/XP.
- Retry behavior: `lesson-flow.ts` schedules failed required items for retry. The current retry keeps the original exercise type, so the #29 requirement to use a different type remains future work.
- Persistence: aggregate progress is stored locally/Supabase through `useProgressStore`; historical attempts and exercise results have migrations and sync events. Authoritative server-side score verification remains incomplete and is outside this increment.
- Derived metrics: lesson completion, best scores, module completion, XP, streak, active time, exercise totals, and mastery are calculated in `LessonView`, `lesson-attempts.ts`, `evaluation.ts`, and `useProgressStore.ts`.
- Exercise support: rendered types are quiz, fill-in, matching, sentence-builder, and listen. `typing` exists in the domain union but is not handled by `ExerciseEngine` or content validation and is currently unsupported in lesson JSON.
- Content inconsistencies observed: the validator is registry-bound rather than filesystem-complete; the requested script name differs from the implementation; build does not invoke validation directly; the content registry's comment claims glob discovery although imports are manual.
- Target models: `ExerciseItemResult`, `ExerciseResult`, and `LessonAttempt` already represent the intended structured result/attempt model. The existing lesson-attempt and granular-learning migrations are the current migration proposal/implementation baseline; no production migration is part of this increment.

## Work completed

- Completed required preflight and full open-issue audit.
- Audited the merged Phase 1/2 architecture and selected one coherent increment.
- Added recursive filesystem discovery for all nested module `meta.json` files and lesson JSON files.
- Added invalid-JSON reporting and bidirectional filesystem/registry drift validation.
- Changed the validation script to validate the filesystem inventory rather than only registered imports.
- Added `npm run validate:content`, retained `validate-content` as a compatibility alias, and made production builds run validation first.
- Added automated tests for discovery, invalid JSON, unregistered filesystem content, and registered content missing from disk.
- Corrected the runtime content-registry documentation and avoided a duplicate standalone validation step in CI because the build now runs it.
- Verified that the existing all-wrong scoring/mastery tests still pass.
- Committed and pushed implementation commit `c727109797d9c606db1169fece08d1e5f57c9325`.
- Opened pull request #92: https://github.com/OBM-OPC/slogovo/pull/92

## Work remaining

- Wait for GitHub Actions run `29244368932` and Vercel preview deployment `5423141669` to complete.
- Request human review when CI and preview deployment are green; do not merge or begin another milestone.
- Broader tracker work not claimed by this increment remains in #71, #28, and #29, including different-type mistake retries and other unverified tracker acceptance criteria.

## Commands executed

- `git status --short --branch`
- `git branch -vv`
- `git worktree list --porcelain`
- `git remote -v`
- `git fetch --prune origin`
- `git ls-remote --heads origin`
- GitHub API queries for branches, all open pull requests, all 19 open issues with their bodies and labels, Actions runs, deployments, deployment statuses, and pull request state
- Process, session, and Git-lock checks for another active Slogovo run
- Read-only source, configuration, migration, workflow, and test inspection commands
- `npm run validate-content` (baseline: 0 errors, 0 warnings)
- `npm run test -- --run src/lib/content-inventory.test.ts src/lib/content-validation.test.ts` (12 tests passed)
- `npm run validate:content` (12 module files and 60 lesson files; 0 errors, 0 warnings)
- `npm run type-check` (passed)
- `npm run lint` (passed with no warnings)
- `npm test` (23 files and 88 tests passed)
- `npm run build` (passed; content validation ran first and Next.js generated 99 static pages)
- `git diff --check` (passed)
- `git commit -m "feat: validate filesystem content inventory"`
- `git push -u origin feat/milestone-1-content-validation`
