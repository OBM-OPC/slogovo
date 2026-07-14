# Slogovo controlled-development status

Last updated: 2026-07-14 21:39 UTC

## UI/UX Epic #100 — active direct-main run

- Owner instruction for this run: implement Epic #100 continuously on `main`, commit and push each completed sub-issue, and close only verified issues. No implementation pull request will be created.
- Preflight: clean `main` at `9fd7437041144ae46478426ec9bd7ad0a1ed23bf`; only remote `main`; controlled-development cron disabled; no parallel Slogovo coding session visible. Open PRs #116 and #117 are Dependabot-owned and are outside this Epic run.
- Inspected: all open issues #100–#115, all issue bodies and acceptance criteria, all open branches/PRs, recent Actions, current component/page architecture, and the prior status history below.
- Prioritized sequence: high-impact landing/demo/auth first, shared design/brand foundations, primary navigation/dashboard/course/onboarding, learning/feedback/progress/gamification, then cross-screen mobile/accessibility verification.

### Completed in this run

- #101 Redesign Landing Page: replaced the client-heavy narrow landing screen with a static, responsive marketing experience; strengthened the value proposition and primary registration CTA; made login a secondary link; added a faithful learning-interface preview, benefit cards, trust metrics, audience use cases, transparent testimonial placeholder, FAQ, legal/social-proof footer, and 5–10-minute lesson guidance.
- #101 verification: focused React test passed; type-check and lint passed; content validation passed (12 modules, 60 lessons, 9 grammar topics, 0 errors/warnings); production build passed (107 pages); Lighthouse production audit scored Performance 98, Accessibility 100, Best Practices 93, SEO 91; `git diff --check` passed.
- #102 Create Interactive Demo Lesson: implemented a no-account, four-stage mini lesson with five audio-capable vocabulary flashcards, a listening question, actionable wrong-answer feedback with the correct solution, three accessible matching pairs, live progress, a completion metrics preview, replay, and registration CTA.
- #102 verification: focused interaction test passed; type-check and lint passed; a Playwright journey completed the entire demo at 320×700, verified the wrong-answer explanation and registration CTA, and found no horizontal overflow; `git diff --check` passed.
- #103 Redesign Login & Registration: added a shared branded auth shell, independently accessible visibility toggles for every password field, live four-signal password strength feedback while preserving the stronger 12–128-character passphrase policy, Caps Lock detection, actionable inline errors, explicit loading/double-submit protection, autocomplete/input hints, confirmation matching, verification-email guidance, and legal/privacy links. Removed the non-functional remember-me control.
- #103 security decision: registration keeps the enumeration-resistant response introduced by #98 instead of revealing whether an email is already registered. This intentionally supersedes the issue's unsafe example while still giving actionable validation errors.
- #103 verification: three focused form interaction tests passed; type-check and lint passed; all four existing auth Playwright journeys passed after selector verification, including a 320×700 registration flow with no horizontal overflow; `git diff --check` passed.
- #114 Design System: added documented semantic color/typography/4px-spacing rules and reusable Button, Card, Input, Badge, linear/circular Progress, modal/alert/confirm Dialog, EmptyState, text/card/list Skeleton, and auto/action/persistent Toast primitives under `src/components/ui`. Dialogs trap focus, support Escape/overlay close, and restore focus. All primitives have Storybook stories; the catalog includes the a11y addon.
- #114 verification: focused component tests passed for accessible fields/progress, dialog focus lifecycle, and persistent/action toasts; type-check and lint passed; the Storybook 10.5 production catalog built successfully; high-severity dependency audit passed (the two previously documented moderate Next.js/PostCSS findings remain); `git diff --check` passed.

### Current and remaining work

- Current issue: commit, push, and close #114, then complete the shared branding layer in #115 before the remaining application screens.
- Remaining Epic issues: #104–#113, #115, and parent #100.
- Production migrations, secrets, environments, production data, paid services, and manual deployments remain untouched.

Last updated: 2026-07-14 17:42 UTC

## Phase 9 implementation checkpoint — issue #98

- Current branch: `feat/complete-slogovo-backlog`.
- Base commit: `80b1ac2773dd778882ceea6c4ccb4445885d356f` on `main`.
- Implementation commit: `4116a6a1c4b018f942fdf6e1dcfa3d44d4c9754f` (`feat: complete Phase 9 security hardening`).
- Validated delivery head: `606aad30fa5857f87386a12de278974b7f3ce72f`; all source-actionable work and required checks are complete.
- Backlog inspected: #98 is the only open GitHub issue and was selected in full; no second issue, branch, worktree, coding run, or pull request was introduced.
- Delivery state: pull request #99 is the sole new/open implementation PR from the sole implementation branch to `main` and is ready for human review: https://github.com/OBM-OPC/slogovo/pull/99. The agent will not merge it.

### Work completed

- Added enforced nonce-based CSP and application-wide HSTS, framing, MIME, referrer, permissions, opener, and resource headers; removed the external font stylesheet and documented required origins.
- Replaced broad public-route matching with exact page/API rules, protected `/api/auth/me` and unknown auth routes, and added same-origin/content-type/body-size/JSON-depth enforcement for state changes.
- Added HMAC-keyed, database-backed atomic rate limits with bounded local fallback and separate login, registration, recovery, reset, TTS, sync, progress, telemetry, and sensitive-account policies. Responses use `429`; structured logs contain no credentials, tokens, email addresses, or private learning text.
- Made registration and password-recovery responses enumeration-resistant, added timing equalization, and standardized a 12–128 character passphrase-friendly policy with a local common-password blocklist.
- Added the additive Phase 9 migration: locked down legacy profile/account privileges, hardened the optional signup trigger, added explicit update `WITH CHECK` policies, created the private rate-limit store/RPC, and added bounded review response/error fields. Added two-user/anonymous SQL RLS regression tests.
- Rebuilt aggregate progress, achievements, streaks, scores, mastery, and review scheduling from authenticated server-validated attempt/review rows. Client progress saves now persist settings only; sync payloads are bounded/versioned and content IDs, ownership, ranges, and idempotency are enforced.
- Hardened TTS with authenticated ownership, fixed provider/voice parameters, text/speed limits, user/IP limits, a ten-second timeout, private response caching, browser Cache Storage reuse, and sanitized failure logging.
- Added verified account export, learning-history deletion, account deletion, password/email change, other-session revocation, privacy/retention documentation, and settings controls with current-password confirmation for destructive actions.
- Added the public no-account demo, goal/knowledge onboarding and path recommendation, FSRS-style stability/difficulty/lapse tracking with response time, normalized mistake categories/improvement state, and local-only microphone recording/replay with explicit permission and no upload/retention.
- Added Dependabot, high-severity dependency auditing, Gitleaks, local Supabase RLS tests, and an OWASP ZAP baseline workflow. Upgraded Next.js to 15.5.18 and Nodemailer to 9.0.3 to remove all high/critical dependency findings.

### Validation evidence

- `npm run type-check` passed.
- `npm run lint` passed with no warnings or errors (Next.js emitted only its CLI deprecation notice).
- `npm test` passed: 53 Vitest files / 201 tests.
- `npm run validate:database` passed: 10 ordered migrations, RLS, additive/destructive policy, and generated types.
- The clean-project Supabase CI stack applied all 10 migrations and passed the pgTAP two-user/anonymous RLS suite, including least-privilege grants and ownership-change rejection.
- `npm run validate:content` passed: 12 modules, 60 lessons, and 9 grammar topics with 0 errors and 0 warnings. The separate pre-existing quality report still lists 299 untested vocabulary items, 554 items without authored audio, and 37 lessons without productive exercises.
- `npm run build` passed and generated 107 pages. The Supabase client emitted a non-fatal Edge-runtime compatibility warning during compilation.
- `npm run test:e2e` passed: 11/11 registration, protected-session, expiry/logout, mobile learning, lesson pass/fail/retry, authoritative cross-device restore, vocabulary review, and telemetry journeys.
- `npm audit --audit-level=high` passed. Two moderate PostCSS findings remain nested under the current Next.js package; npm's suggested forced remediation incorrectly downgrades Next.js and was not applied.
- Gitleaks passed across all 49 commits after narrowly allowlisting only the exact isolated E2E fixture password; OWASP ZAP passed its 43-URL baseline with documented informational exceptions.
- `git diff --check` passed.

### Remaining and owner-controlled work

- Apply the reviewed migration through the staging/production database workflow and configure a strong production `RATE_LIMIT_HMAC_SECRET`; neither action was performed here.
- Supply and legally approve the operator address/contact details in the legal notice before public production use.
- Decide the owner-controlled removal/backfill plan for obsolete legacy reset/verification columns. The migration already blocks client updates but does not destructively drop production columns.
- Enable repository-native GitHub secret scanning if the repository plan supports it; Gitleaks now provides the source-controlled CI equivalent.
- Review pull request #99 and the documented production/legal steps. The implementation is ready for human review; only the owner may decide whether and when to merge.
- Issue #98 remains open pending owner review and these owner-controlled acceptance steps; no production migration, data deletion, environment/secret change, paid-service activation, manual deployment, issue closure, or merge was performed.

### Commands and external state inspected

- Inspected local status/history/worktrees/branches/locks/processes and confirmed no concurrent Slogovo coding run.
- Inspected all remote branches, open pull requests, open issues, issue #98's complete acceptance criteria, and the latest `main` Actions run (`29280694621`, passed).
- Ran the validation commands listed above plus focused security, registration, scheduler, middleware, authoritative-progress, and failing-browser reruns during implementation.
- GitHub Actions CI run `29354269134`, Security run `29354269137` (dependency/Gitleaks, clean-project Supabase RLS, and ZAP), and Vercel passed on validated delivery head `606aad3`. Production Supabase was not accessed or changed.

---

Last updated: 2026-07-14 16:32 UTC

## Active run — issue #98 Phase 9 security and product hardening

- Current branch at audit: `main` (`80b1ac2773dd778882ceea6c4ccb4445885d356f`); the single implementation branch will be `feat/complete-slogovo-backlog`.
- GitHub state: issue #98 is the only open issue; only remote `main` exists; no pull request is open; latest `main` CI run `29280694621` passed.
- Concurrent-run state: one clean worktree, no Git lock, no Slogovo implementation process, and no controlled-development cron job or parallel coding run exists.
- Production boundary: this run may add reviewed migrations and deployment configuration in source control, but will not apply production migrations, alter production environment values/secrets, change production data, activate paid services, or merge the resulting pull request.

### Complete issue #98 audit

| Workstream | Classification | Current evidence and remaining acceptance work |
| --- | --- | --- |
| 1. Security headers/CSP | Open | `next.config.js` has no headers and middleware emits no nonce/CSP. |
| 2. Distributed rate limiting | Open | Auth, sync, telemetry, and TTS routes have no shared-instance limiter. |
| 3. Account enumeration | Partial | Forgot-password is generic; registration returns a duplicate-specific 409 and user payload. |
| 4. Sensitive `users` columns | Open | Legacy schema permits broad own-row updates and retains Auth-managed token columns. |
| 5. Provider-token access | Open | Legacy `accounts` RLS allows authenticated reads of raw provider tokens. |
| 6. Explicit RLS checks | Partial | Inserts use `WITH CHECK`; several update policies lack explicit `WITH CHECK`, and the legacy user policy does too. |
| 7. Signup trigger hardening | Open | Legacy `handle_new_user()` is `SECURITY DEFINER` without an empty search path or explicit execution revocation. |
| 8. Explicit public routes | Open | Middleware uses broad prefix matching and treats `/api/auth/me` as public. |
| 9. Origin/CSRF checks | Open | State-changing APIs do not centrally validate origin or JSON content type. |
| 10. Password policy | Open | Password rules differ by route, allow unbounded inputs, and require composition instead of passphrase length. |
| 11. Authoritative progress/rewards | Partial | Lesson IDs, answers, scores, XP, user ownership, and attempt IDs are server-validated/idempotent; aggregate progress save still accepts client-controlled streak/achievement state and review IDs are not content-validated. |
| 12. TTS abuse/cost controls | Partial | TTS is authenticated by middleware and caps text/voice/speed; shared rate limits, timeout, safer caching/logging, and usage monitoring remain. |
| 13. RLS regression tests | Partial | Static policy contracts exist; explicit two-user/anonymous permission regression coverage and local execution documentation remain. |
| 14. Security scanning | Open | CI lacks dependency, secret, and web baseline scanning; Dependabot is absent. |
| 15. Privacy/account controls | Open | Local reset exists, but verified export/deletion/password/email/session controls and legal/retention documentation are absent. |
| 16. Public demo lesson | Open | The landing page has no interactive, no-account learning demo. |
| 17. Goal onboarding/placement | Partial | Daily goal and transliteration settings exist; first-run knowledge/goal questions and initial recommendation are absent. |
| 18. Spaced repetition | Partial | Due queue, bidirectional prompts, review dates, ease, synchronization IDs, and explanations exist; explicit stability/difficulty/lapse and response-time scheduling fields remain. |
| 19. Mistake practice | Partial | Mistake queue/page and recent/weak prioritization exist; normalized error categories and explicit improved-state lifecycle remain. |
| 20. Pronunciation/listening | Partial | Normal/slow playback, source fallback, self-review, and honest non-scoring disclosure exist; recording/replay, consent handling, word playback/stress guidance remain. |

### Dependency order and acceptance plan

1. Establish request security primitives: nonce CSP/headers, exact route policy, origin/content-type/body limits, and database-backed rate limiting.
2. Harden authentication, legacy database privileges/functions/RLS, TTS, and server-authoritative synchronization.
3. Add repeatable security tests/scanning and account privacy/export/deletion/session controls without performing production actions.
4. Complete the genuinely missing demo/onboarding/review/mistake/pronunciation behavior, preserving the already-authoritative learning domain.
5. Run focused and full validation, push the single branch, open exactly one Draft PR, and verify GitHub/Vercel status where accessible.

### Owner-controlled or conditional items

- Production migrations and new production environment values (including a rate-limit HMAC secret) require owner execution after review.
- Native-language copy beyond existing reviewed phrases, legal-text approval, GitHub Advanced Security features unavailable to the repository plan, paid monitoring/rate-limit vendors, and production data deletion/export operations are not performed by this run.
- Breached-password checking will use a local high-confidence denylist unless the owner later approves a network dependency and its availability/privacy trade-offs.

---

Last updated: 2026-07-13 19:42 UTC

## Complete-backlog final checkpoint

- Current branch: `feat/complete-slogovo-backlog`.
- Base commit: `29bcf6a11fb39e86786327ef722ac9ee14e8a019`.
- Final implementation head: `efefc6317d2c24e9f02f74d7344f475eab67124d` (`feat: report real mastery progress`).
- Pull request: #97, the sole implementation PR from the sole implementation branch to `main`; ready-for-review handoff after this documentation checkpoint passes required checks. It must not be merged by the agent.
- Backlog result: all 17 issues inspected for this program are closed complete: #30, #31, #32, #33, #34, #35, #61, #62, #63, #64, #65, #66, #67, #68, #69, #70, and #71. No relevant actionable GitHub issue remains open.
- Concurrent-run result: no second worktree, implementation branch, pull request, or coding run was introduced; the legacy single-milestone worker remains disabled.

### Work completed in the resumed run

- #33 adaptive daily learning: `799541b`; GitHub Actions `29274674819` and Vercel passed.
- #34 listening and speaking foundation: `90a7bf9`; GitHub Actions `29275480138` and Vercel passed.
- #69 privacy-safe analytics and monitoring: `8c1fc8f`; GitHub Actions `29276832050` and Vercel passed. Only allowlisted identity-free learning events and controlled monitoring codes are stored; no vendor or paid service was activated.
- #61 rationalized product navigation: `8e693eb`; GitHub Actions `29277334393` and Vercel passed. Lernen owns the single dominant daily action; Wiederholen, Sprechen, Fehler, Wortschatz, and Fortschritt have distinct purposes and mobile paths.
- #62 lesson/mobile/accessibility polish: `608f68a`; GitHub Actions `29278003530` and Vercel passed. Added Bulgarian input assistance, answer-state semantics, loading/empty/success/retry states, focus/touch treatment, reduced motion, and narrow-mobile coverage.
- #63 learning-based gamification: `af7dd13`; GitHub Actions `29278671297` and Vercel passed. XP, achievements, streaks, active time, and goals now depend on demonstrated learning; fixed minutes, empty click-through, failed attempts, and retry-item farming do not earn XP.
- #64 real mastery dashboard: `efefc63`; GitHub Actions `29279220524` and Vercel passed. Added measured active time, passed/mastered separation, due vocabulary, receptive/productive mastery, grammar, listening, weak-area, and recent-improvement metrics with authenticated privacy-minimized attempt summaries.
- #35 Phase 8 tracker closed after #61–#64 and its cross-page criteria were verified.

### Final validation evidence

- `git diff --check`, `npm run type-check`, and `npm run lint` passed.
- 46 Vitest files / 190 tests passed, including authoritative evaluation, sync/idempotency, analytics privacy, mobile accessibility, gamification anti-farming, and progress-insight rules.
- `npm run validate:database` passed for all 9 additive migrations and generated database types.
- `npm run validate:content` passed for 12 modules, 60 lessons, and 9 grammar topics with 0 errors and 0 warnings; the separate quality report still documents 299 untested vocabulary items, 554 missing authored-audio assets, and 37 lessons without productive exercises.
- The production build passed with 103 generated pages.
- Playwright passed 11/11 auth, protected-session, adaptive-learning, 360px Bulgarian-input, honest progress-empty-state, lesson pass/fail/retry, sync/restore, vocabulary-review, and telemetry journeys. A focused rerun of the progress empty state also passed after the fixture received the attempt-summary read contract.
- GitHub Actions passed on every implementation increment through run `29279220524`; Vercel preview checks passed through final implementation head `efefc63`.

### Remaining and owner-controlled work

- Actionable implementation backlog: none.
- Human action: review PR #97 and decide whether/when to merge. The agent will not merge it.
- Production actions remain excluded: apply approved migrations, choose/implement raw telemetry retention, activate any paid monitoring service, change production environment values, or alter production data/secrets only through owner-controlled procedures.
- Content-quality findings are documented rather than silently treated as complete content production; authored audio and any material Bulgarian copy additions require appropriate owner/native-language review.
- No production migration, data mutation, environment/secret change, paid-service activation, manual deployment, or merge was performed.

---

Last updated: 2026-07-13 18:52 UTC

## Complete-backlog program

- Current branch: `feat/complete-slogovo-backlog`
- Base commit: `29bcf6a11fb39e86786327ef722ac9ee14e8a019`
- Current implementation commit: `90a7bf9` (`feat: complete listening and speaking foundation`); adaptive daily learning commit: `799541b`; earlier content/testing/database/architecture/evaluation/sync/auth commits remain on this branch.
- Draft pull request: #97, `feat/complete-slogovo-backlog` to `main`.
- GitHub state at restart: exactly the Draft PR and backlog branch above plus `main`; PR CI run `29265699487` passed on the prior remote head `6b3ed5e`; latest `main` CI run `29264112422` passed.
- Concurrent-run state: the legacy 45-minute single-milestone worker is disabled; no second worktree, Git lock, implementation process, branch, or pull request exists.
- Production boundaries: no production migration, data, environment, secret, DNS, paid-service, or deployment action is authorized.

### Complete open-issue inventory

| Priority | Issue | Classification | Current evidence and remaining acceptance work |
| --- | --- | --- | --- |
| P0 | #31 Phase 4 authentication and security | Closed complete | Removed the JavaScript-readable custom session mirror, centralized browser auth calls behind same-origin APIs, retained Supabase SSR cookie refresh, verified protected routes and API session checks, documented secret handling, and expanded cookie/middleware/RLS contract coverage. |
| P0 | #32 Phase 5 reliable progress synchronization | Closed complete | Added authenticated server sync, bounded shared schemas, server-side lesson-outcome recalculation, stable device/event IDs, non-lossy server merges, preserved review history, reconnection retry, idempotent conflict indexes, and multi-device/duplicate/recovery tests. |
| P1 | #30 Phase 3 answer evaluation and feedback | Closed complete | All typed lesson/listening/vocabulary paths now share one detailed evaluator with Unicode/punctuation/quote normalization, authored variants, optional pronouns, explicit transliteration, typo and grammar handling, persisted rich feedback statuses, specific UI feedback, and focused domain/component tests. |
| P1 | #71 Milestone 1 audit and Phase 1/2 plan | Closed complete | Consolidated the course architecture, data flow, historical correctness-loss points, all calculation owners, supported types, content inconsistencies, target models, migrations, and verification evidence; the implemented scoring/content/all-wrong work is fully mapped. |
| P1 | #68 Learning-domain architecture rules | Closed complete | Added bounded shared schemas, content-backed server answer/attempt validation, typed learning errors, safe structured logs, stable-ID/idempotency enforcement, explicit mastery fields, architecture documentation, and the learning review checklist; removed unaudited standalone result mutation. |
| P2 | #67 Migration rules and database type workflow | Closed complete | Documented additive migration, staging, type-generation, backfill, RLS, recovery, and owner-only production rules; added `validate:database` and CI enforcement for ordering, destructive markers, public-table RLS, and generated table/column types. |
| P2 | #65 Full automated testing strategy | Closed complete | Added Playwright, an isolated Supabase-compatible E2E fixture, seven auth/session/lesson/review/sync/restore journeys, direct quiz/sentence-builder/retry component coverage, author documentation, and the CI browser gate. |
| P2 | #66 Course content quality report | Closed complete | Added an author-facing inventory and exact file/ID findings for untested vocabulary, missing authored audio, accepted-answer gaps, unsupported types, duplicate stable IDs, grammar gaps, and lessons without productive exercises; the report runs standalone and in content validation/build. |
| P2 | #33 Adaptive daily learning session | Closed complete | Added the primary “Heute lernen” flow, bounded UI-independent planner, backlog-aware new-item cap, overdue/mistake/recent/grammar/listening/productive/speaking sources, and separately synchronized recognition/production mastery. |
| P2 | #34 Listening and pronunciation | Closed complete | All five listening formats render and score; normal/slow, cache/native/offline/TTS source selection, bounded hints, visible failure/source states, duplicate-token reorder, daily speaking practice, and explicitly non-scored transcript matching are implemented and verified. |
| P2 | #69 Privacy-conscious analytics and monitoring | In progress | First-party identity-free schemas, storage migration, lifecycle instrumentation, controlled monitoring signals, and a privacy review are implemented locally; full validation, remote checks, and issue completion remain. External paid monitoring is not enabled. |
| P3 | #61 Product navigation areas | Open | Current navigation exposes overlapping course/dashboard/settings paths and lacks the requested Lernen/Wiederholen/Sprechen/Fehler/Wortschatz/Fortschritt product model. |
| P3 | #62 Lesson interface/mobile/accessibility | Partially implemented | Keyboard handling and some live states exist. Complete mobile ergonomics, Bulgarian input assistance, loading/empty/recovery states, screen-reader labels, focus behavior, and reduced-motion coverage remain. |
| P3 | #63 Gamification based on learning metrics | Partially implemented | Attempts now use real score/time and anti-click-through gates, but achievement/XP/streak rules and UI still need an explicit anti-farming real-learning model. |
| P3 | #64 Progress dashboard mastery metrics | Open | Existing progress UI does not expose the full event-based receptive/productive/grammar/listening/weak-area/improvement model or complete states. |
| P3 | #70 Development delivery template | Closed complete | Added the repository PR template with findings, proposal, risks, implementation, full validation matrix, manual tests, remaining work, learning-domain review rules, and the functional definition-of-done warning. |
| P3 | #35 Phase 8 tracker | Partially implemented | Parent tracker for #61–#64 plus cross-page state/accessibility work; complete only after its child acceptance criteria are verified. |

No issue is currently classified as duplicate or obsolete. Potential owner blockers will be recorded per issue without stopping unrelated work. Native-speaker approval is required only if implementation would introduce or materially revise uncertain Bulgarian content; paid analytics/monitoring activation and production actions remain owner-only.

### Dependency and execution order

1. P0 security/auth (#31), then persistence/sync (#32).
2. Authoritative evaluation/domain rules (#30, #68), then migration/type workflow (#67).
3. Testing and content observability foundations (#65, #66, #70, #71).
4. Adaptive daily flow (#33), listening/speaking (#34), and privacy-conscious analytics (#69).
5. Navigation, lesson ergonomics, gamification, and progress dashboard (#61–#64), then parent tracker #35.

### Current work

- Current issue: #69 privacy-conscious learning analytics and monitoring.
- Completed and closed issues: #30, #31, #32, #33, #34, #65, #66, #67, #68, #70, and #71.
- Completed in this run: restarted from the interrupted working tree without discarding changes; repeated repository/GitHub/CI/concurrency preflight; re-inspected all 17 open issue bodies; finished the Phase 4 auth increment in commit `124c231`; finished the Phase 5 synchronization increment in commit `f7edc1d`.
- Phase 4 details: Supabase SSR remains the only session authority; refresh tokens stay in HTTP-only Supabase cookies; custom mirrored auth cookies and direct browser auth calls were removed; protected routes/APIs verify `getUser`; RLS coverage for attempts, results, review/activity/offline history, aggregate settings, and achievements is enforced by migrations and schema-contract tests; security/API documentation was corrected.
- Phase 5 details: browser queue writes now go through authenticated `/api/sync`; incoming batches are schema-bounded; lesson outcome fields are recalculated on the server; progress saves merge with the current server row; camel-case API progress no longer resets during deserialization; stable device/event IDs are persisted; failed events remain queued; browser reconnect retries events and the aggregate snapshot; duplicate and two-device review events remain distinct and idempotent.
- Phase 3 details: replaced duplicated evaluation/Levenshtein paths with one detailed evaluator; normalized Unicode, whitespace, punctuation, and quote variants; accepted only authored alternatives and transliterations; added opt-in subject-pronoun omission; distinguished correct-with-typo, accepted-variant, wrong-form, missing-word, and incorrect feedback; wired fill-in, typed listening/dictation, and vocabulary typing; persisted feedback status independently from scoring status; added author-option validation and component/domain tests.
- Architecture details: the server now maps every submitted lesson item back to authored content, recalculates item correctness/feedback and attempt duration, derives required/productive flags and accepted answers, rejects omitted required first attempts, unknown IDs, invalid retry types, and unaudited standalone result writes, then recalculates score/pass/mastery/XP. Progress and sync requests use bounded Zod schemas; validation failures use stable error codes and safe structured logs. Strict mastery fields replaced unchecked casts, and spaced-repetition updates preserve them.
- Delivery-template details: `.github/pull_request_template.md` now requires findings, proposal, risks, implementation, lint/type/unit/component/E2E/content/build validation, manual tests, remaining work, the learning-domain review checklist, and an explicit warning against UI-only completion claims.
- Database-workflow details: `docs/database-workflow.md` defines immutable applied migrations, additive compatibility, idempotent/batched backfills, staging verification, RLS tests, generated-type commands, forward-fix recovery, and owner-controlled production/PITR actions. `validate:database` checks ordered unique timestamps, review markers for destructive SQL, RLS on every created public table, and generated table/column coverage; CI runs it after lint.
- Automated-testing details: Playwright now runs against an in-memory Supabase-compatible auth/PostgREST service with no deployed credentials. Seven browser journeys cover registration, login, HttpOnly cookies, session expiry, route protection, logout, lesson start/pass/fail/alternative retry, due vocabulary review, event sync, and clean-context progress restore. Added direct quiz, sentence-builder, and `LessonView` retry component tests, fixed form label associations discovered by accessibility-first locators, documented the three-layer strategy, and added Playwright to CI.
- Content-quality details: `npm run content:report` and `validate:content` now report 12 modules, 60 lessons, 554 vocabulary items, and 315 exercise items with author-readable file/ID findings. The current baseline exposes 299 untested vocabulary items, 554 items without authored audio, and 37 lessons without productive exercises; accepted-answer, supported-type, duplicate-ID, and grammar-explanation checks currently report zero gaps. Coverage definitions and native-review rules are documented in `docs/content-guidelines.md`.
- Phase 1/2 audit details: `docs/phase-1-2-audit.md` now traces the pre-foundation correctness loss (`onComplete()` without results, block-count scoring, unconditional completion/fixed study credit) through the current structured client result, alternative retry, calculated attempt, merge-safe aggregate, authenticated sync, content-backed server replay, and idempotent granular persistence flow. It maps every score/pass/mastery/XP/time/streak owner, supported/unsupported types, current content gaps, implemented models, all seven migrations, and exact automated evidence.
- Phase 6 details: `/lernen` now leads to a single adaptive daily sequence; the pure planner prioritizes overdue, failed/weak, recent, grammar, limited new, listening, productive, and speaking work, caps new items under large review backlogs, and uses separately recorded recognition/production mastery. Commit `799541b`; GitHub Actions `29274674819` and Vercel passed.
- Phase 7 details: the listening engine supports select, type, dictation, duplicate-safe reorder, and audio-only comprehension; playback supports normal/slow authored audio, Cache Storage, offline fallback, and TTS with visible state and bounded hints. Daily speaking is a transparent self-review, and transcript matching explicitly records pronunciation as not evaluated. Commit `90a7bf9`; GitHub Actions `29275480138` and Vercel passed.
- Blocked issues: none yet.
- Commands run at restart: Git status/log/worktree/branch/lock/process inspection; OpenClaw cron inspection; GitHub REST inspection of all remote branches, the open Draft PR, all 17 issue bodies, reviews, and recent Actions; auth/sync source, store, migration, schema, and test audits; focused Vitest runs; full validation; `git diff --check`; logical commits.
- Validation on `90a7bf9`: type-check, 42 files / 170 tests, 8 migration checks, content validation (0 errors/warnings), 100-page production build, Playwright 8/8, GitHub Actions `29275480138`, and Vercel passed.
- Vercel: preview deployments passed through `90a7bf9`; no setting or manual deployment action performed.
- Supabase: local additive migrations and generated-style types now cover sync history, recognition/production practice mode, and the pending privacy-safe telemetry table; no production migration, data, environment, or secret action performed.
- Owner decisions required: none at present.

---

Last updated: 2026-07-13 15:49 UTC

## Active run — Phase 1 content correctness gate

- Current branch: `fix/phase-1-content-correctness`, based on `main` commit `1eb0f66c0a333854fb9e8e295d3b63aeb12007cf`.
- Implementation commit: `43f05672606444b6900af972a10482f623587665`.
- Remote branches inspected: only `main`; no implementation branch or open pull request exists.
- PR #95 was squash-merged before this run as `1eb0f66c0a333854fb9e8e295d3b63aeb12007cf`; its branch was deleted.
- Latest GitHub Actions result: post-merge `main` run `29262028156` completed successfully.
- All 18 open issues inspected: #71, #70, #69, #68, #67, #66, #65, #64, #63, #62, #61, #35, #34, #33, #32, #31, #30, and #28. Issue #29 is closed after PR #95.
- Concurrent-run check: no additional worktree, Git lock, Slogovo coding process, visible Slogovo session, or subagent was found. Session visibility is restricted to the current session tree.

### Selected milestone

Selected issue: #28 — Phase 1 content correctness and validation.

Reasoning: the Phase 2 scoring milestone is merged and issue #29 is closed. The highest-priority unblocked learner-facing defect is now the explicit Phase 1 correctness gap: the landing page contains the Russian ending `начинающих`, and both the first `съм` lesson and grammar reference incorrectly claim that the present-tense copula is usually omitted. The existing validator also permits incomplete grammar, missing A1 transliteration, and native-review placeholders to reach a production build.

Scope:

- Correct the landing-page Bulgarian label to `Български за начинаещи`.
- Replace the inaccurate `съм` explanations and ungrammatical omission examples with accurate present-tense guidance in lesson content and the grammar reference.
- Make required lesson narrative and grammar fields production-blocking rather than warnings.
- Require non-empty `bgLatin` for A1 vocabulary and reject unresolved native-review markers.
- Validate the static grammar-topic registry so incomplete grammar reference content also fails `npm run validate:content` and the production build.
- Add focused regression and validation tests.

Out of scope:

- A full native-speaker review of all 60 lessons, bulk vocabulary enrichment, transliteration-system redesign, new exercise types, database changes, environment changes, and production actions.

Dependencies:

- `src/app/page.tsx`, `content/a1/module-1/lessons/lektion-2.json`, `src/lib/content.ts`, `src/lib/content-validation.ts`, `scripts/validate-content.ts`, and focused tests.

Risks:

- Tightening warnings into errors can expose latent content gaps across the full inventory.
- Grammar-topic validation must remain generic and avoid hard-coding only the two known corrections.
- Copy corrections must not introduce unsupported linguistic claims.

Acceptance criteria:

- The landing page displays `Български за начинаещи` and no longer contains the Russian ending.
- The lesson and grammar reference explain that present-tense forms of `съм` are normally required, while subject pronouns may be omitted when context is clear.
- Missing A1 `bgLatin`, unresolved `NATIVE_REVIEW_NEEDED`, `needsNativeReview: true`, and incomplete lesson or grammar content fail validation.
- Every registered grammar topic is included in content validation.
- Focused tests and the complete type-check, lint, unit-test, content-validation, and production-build suite pass.
- Exactly one implementation branch and one pull request are used.

### Work completed

- Completed the required local, GitHub branch/PR, all-open-issue, Actions, and concurrent-run preflight.
- Confirmed PR #95 and post-merge CI are green and no milestone remains active.
- Audited the current Phase 1 types, filesystem inventory, validator, content guidelines, landing copy, first `съм` lesson, and grammar reference.
- Selected and recorded this single coherent milestone before implementation changes.
- Corrected the landing label from the Russian `Български за начинающих` to Bulgarian `Български за начинаещи`.
- Corrected the first `съм` lesson and grammar reference to teach that present-tense copula forms normally remain while the subject pronoun may be omitted; removed three ungrammatical omission examples and corrected `Той е добре.` to German `Ihm geht es gut.`.
- Made missing lesson introductions, summaries, grammar titles, explanations, and examples production-blocking validation errors.
- Required a non-empty `bgLatin` reading aid for every A1 vocabulary item and made unresolved native-review flags and markers production-blocking.
- Removed 245 unresolved optional A2 transliteration placeholders from 26 lesson files rather than fabricating unreviewed Latin forms; A2 transliteration remains optional under the documented policy.
- Added validation for all nine registered grammar topics, including unique IDs/slugs and complete titles, descriptions, sections, explanations, and bilingual examples.
- Added focused regression tests for the known linguistic corrections and validator tests for A1 transliteration, native-review blockers, incomplete lesson content, grammar-topic completeness, and duplicate topic identity.
- Full validation passed: type-check, lint, 26 test files / 114 tests, content validation with 12 modules / 60 lessons / 9 grammar topics and 0 errors / 0 warnings, production build with 99 static pages, and `git diff --check`.
- No database schema, Supabase data, production environment, Vercel setting, or secret was changed.
- Committed the implementation, pushed the sole branch, and opened pull request #96: https://github.com/OBM-OPC/slogovo/pull/96
- Confirmed PR #96 is non-draft and mergeable with no reviews or requested changes at head `d7160b7dfe45e8c9ee192417351a57b0abf250ed`.
- GitHub Actions validation run `29263751960` and the Vercel preview deployment completed successfully for PR #96.

### Work remaining

- Commit and push this final delivery status.
- Verify the resulting documentation-only PR head receives green GitHub Actions and Vercel checks.
- Squash-merge PR #96 and delete the branch only if every automatic-merge condition remains satisfied; otherwise stop and report the blocker.

### Commands executed in this run

- Local Git status, branch, remote, worktree, lock, process, and repository-history inspection.
- GitHub API inspection of all remote branches, open pull requests, all 18 open issues and bodies, PR #95, and the latest Actions runs.
- OpenClaw cron history, visible-session, and subagent inspection.
- Read-only audit of content types, registry, validator, tests, guidelines, landing copy, lesson content, and grammar topics.
- `git switch -c fix/phase-1-content-correctness`.
- Focused Vitest run for content validation and known corrections (2 files / 18 tests passed).
- `npm run validate:content` (initially identified 245 unresolved A2 placeholders; final run passed with 12 modules, 60 lessons, 9 grammar topics, 0 errors, and 0 warnings).
- Bulk mechanical removal of optional `NATIVE_REVIEW_NEEDED` A2 transliteration fields from 26 lesson files.
- `npm run type-check` (passed).
- `npm run lint` (passed with no warnings or errors).
- `npm test` (26 test files and 114 tests passed).
- `npm run build` (passed; content validation ran first and 99 static pages were generated).
- `git diff --check` (passed).
- `git commit -m "fix: enforce Phase 1 content correctness"`.
- `git commit -m "docs: record Phase 1 validation results"`.
- `git push -u origin fix/phase-1-content-correctness`.
- GitHub API pull request creation (opened #96).
- GitHub API inspection of PR merge state, reviews, check runs, commit status, GitHub Actions, and Vercel preview.

---

Last updated: 2026-07-13 15:20 UTC

## Active run — Phase 2 required exercise groups

- Current branch: `feat/phase-2-required-groups`, based on `main` commit `6b18db8b1a4ba0aed3cd826a291a545b6ba622c9`.
- Implementation commit: `5c1b9632b5fe2045ef97e39c33c46cca10ed74a8`.
- Preflight found only remote `main`, no open pull request, green post-merge CI run `29260241894`, no additional worktree or Git lock, and no active Slogovo coding run.
- The controlled development cron is temporarily disabled during this interactive run and will be re-enabled at handoff.
- All 19 open issues inspected: #71, #70, #69, #68, #67, #66, #65, #64, #63, #62, #61, #35, #34, #33, #32, #31, #30, #29, and #28.

### Selected milestone

Selected issue: #29 — Phase 2 lesson scoring around mastery.

Reasoning: PRs #91–#94 now cover structured results, historical attempts, thresholds, required items, productive work, alternative-type deferred retries, all-wrong protection, and the full learner-facing performance summary. The remaining explicit Phase 2 acceptance gap is enforcement of configured required exercise groups.

Scope:

- Add an explicit, typed lesson configuration for required exercise groups using stable exercise IDs and a minimum passed count.
- Enforce configured groups in the authoritative lesson outcome calculation and expose missing group IDs in the outcome.
- Wire lesson configuration through `LessonView` and `createLessonAttempt`.
- Validate group IDs, referenced exercise IDs, uniqueness, and minimum counts in content validation.
- Add focused scoring and content-validation tests.

Out of scope:

- Changing existing lesson scores or adding group configuration to production content, new exercise types, UI redesign, production schema changes, environment changes, and production actions.

Dependencies:

- `src/types/learning.ts`, `src/types/index.ts`, `src/lib/evaluation.ts`, `src/lib/lesson-attempts.ts`, `src/lib/content-validation.ts`, and `src/components/lesson/LessonView.tsx`.

Risks:

- Retry results must satisfy the original logical exercise without being counted as a separate exercise.
- Invalid content references must fail validation before build.
- Empty or impossible group configurations must fail clearly rather than silently weakening pass rules.

Acceptance criteria:

- A configured group fails the lesson when fewer than its required exercises have every required item answered correctly at least once.
- A successful deferred retry can satisfy the original exercise in its configured group.
- Overall score alone cannot bypass a missing required group.
- Invalid group configuration fails content validation with author-readable paths/messages.
- Lessons without group configuration preserve current behavior.
- Focused tests and the complete type-check, lint, unit-test, content-validation, and production-build suite pass.
- Exactly one implementation branch and one pull request are used.

### Work completed

- Completed the controlled preflight and full open-issue audit.
- Selected and recorded this coherent milestone before implementation changes.
- Added typed `RequiredExerciseGroup` lesson configuration using stable exercise IDs and an optional minimum passed count.
- Enforced groups inside the authoritative lesson outcome: an exercise counts only after every required logical item has passed at least once, and retries retain the original exercise identity.
- Exposed missing group IDs in `LessonOutcome` and wired lesson configuration through `LessonView` and `createLessonAttempt`.
- Added content validation for missing/duplicate group IDs, empty groups, duplicate/unknown exercise references, impossible minimums, and exercises containing only optional items.
- Added tests proving score cannot bypass a missing group, deferred retries satisfy the original group, minimum counts are enforced, invalid content fails, and attempt creation uses the group gate.
- Verified every acceptance criterion in issue #29 is now covered by merged work plus this increment; the pull request may close #29 after checks pass.
- Clean install completed with 520 packages installed and 521 audited; the existing audit reports 6 dependency vulnerabilities (1 moderate, 5 high) outside this milestone.
- Full validation passed: type-check, lint, 25 test files / 108 tests, content validation with 12 modules and 60 lessons / 0 errors / 0 warnings, production build with 99 static pages, and `git diff --check`.
- No existing lesson content, database schema, production data, environment, Vercel setting, or secret was changed.
- Committed implementation and status updates, pushed the sole branch, and opened pull request #95: https://github.com/OBM-OPC/slogovo/pull/95
- Confirmed PR #95 is non-draft and mergeable with no requested changes at implementation head `9fc6024b7c2ae590ff155ce3b9a842f3ba03a943`.
- GitHub Actions validation run `29261724871` and the Vercel preview deployment completed successfully for PR #95.

### Work remaining

- Commit and push this final delivery status.
- Verify the resulting final PR head receives green GitHub Actions and Vercel checks.
- Squash-merge PR #95 and delete the branch only if every automatic-merge condition remains satisfied; otherwise stop and report the blocker.

### Commands executed in this run

- Local Git status, branches, worktrees, locks, processes, cron state, open PRs, all 19 open issues and bodies, and latest Actions inspection.
- `openclaw cron disable 717c5071-e0fd-43bd-b45c-4144f4d98403` to prevent overlapping coding runs.
- `git switch -c feat/phase-2-required-groups`.
- Focused Vitest runs for evaluation, lesson attempts, and content validation (26 tests passed in the final focused run).
- `npm ci` (520 packages installed; 521 audited).
- `npm run type-check` (passed).
- `npm run lint` (passed with no warnings or errors).
- `npm test` (25 test files and 108 tests passed).
- `npm run validate:content` (12 module files and 60 lesson files; 0 errors and 0 warnings).
- `npm run build` (passed; content validation ran first and 99 static pages were generated).
- `git diff --check` (passed).
- `git commit -m "feat: enforce required exercise groups"`.
- `git commit -m "docs: record required group milestone"`.
- `git push -u origin feat/phase-2-required-groups`.
- `gh pr create --base main --head feat/phase-2-required-groups` (opened #95).
- `gh pr checks 95 --watch` (GitHub Actions and Vercel passed for `9fc6024`).

## Active run — Phase 2 performance summary

- Current branch: `feat/phase-2-performance-summary`, based on `main` commit `765897f8dc951f83636f9f02136beba9a59c250d`.
- Implementation commit: `3644c3a68db4064ae6bd3c25875604d7e4406684`.
- Remote branches inspected: only `main`; no implementation branch existed before this run.
- Open pull requests inspected: none.
- Latest GitHub Actions result: post-merge `main` run `29256497796` completed successfully for `765897f`.
- Concurrent-run check: no additional worktree, Git lock, Slogovo coding process, or active cron run was found. The 45-minute development cron is temporarily disabled for this interactive run and will be re-enabled at handoff.
- All 19 open issues inspected: #71, #70, #69, #68, #67, #66, #65, #64, #63, #62, #61, #35, #34, #33, #32, #31, #30, #29, and #28.

### Selected milestone

Selected issue: #29 — Phase 2 lesson scoring around mastery.

Reasoning: structured exercise results, real pass/mastery gates, historical attempts, active time, and alternative-type deferred retries are now integrated. The highest-priority remaining concrete Phase 2 gap is the required learner-facing performance summary: the domain helper calculates score and vocabulary buckets, but `LessonView` bypasses it and does not show strongest/weakest skill, mastered and weak items, or a calculated recommended next action.

Scope:

- Make the lesson performance summary the authoritative presentation model for completed attempts.
- Calculate per-skill performance from first attempts without allowing retries to inflate skill accuracy.
- Expose strongest skill, weakest skill, weak vocabulary, mastered vocabulary, active time, and a deterministic recommended next action.
- Render those calculated values in the actual lesson summary screen for passed and failed attempts.
- Add focused domain and component tests proving real attempt values reach the UI.

Out of scope:

- Scoring-threshold changes, new exercise types, dashboard redesign, Phase 8 work, production database changes, environment changes, and production actions.

Dependencies:

- `src/lib/lesson-summary.ts`, `src/lib/evaluation.ts`, `src/components/lesson/LessonView.tsx`, the authoritative `LessonAttempt` model, and existing vocabulary IDs on item results.

Risks:

- Retry results could inflate skill metrics unless only first logical item attempts are used.
- Some items lack vocabulary IDs, so skill metrics must remain useful independently of vocabulary buckets.
- Summary labels and recommendations must be deterministic and must not overstate mastery.

Acceptance criteria:

- Summary accuracy, score, counts, XP, and active time come from the persisted `LessonAttempt`.
- Strongest and weakest skills are calculated from first logical item attempts with stable tie-breaking.
- Weak and mastered vocabulary IDs are exposed without counting later retries as first-try mastery.
- Recommended next action differs appropriately for failure, pass-with-weak-items, and clean pass/mastery.
- `LessonView` renders real summary values, strongest/weakest skill, vocabulary outcomes, and the recommended action.
- Focused tests and the full type-check, lint, unit-test, content-validation, and production-build suite pass.
- Exactly one implementation branch and one pull request are used.

### Active work

- Completed the controlled preflight and full issue audit.
- Selected and recorded this single coherent milestone before changing implementation code.
- Made `buildLessonPerformanceSummary` the authoritative presentation model for persisted attempt score, accuracy, counts, XP, and active time.
- Added retry-safe per-skill performance based on first logical item attempts, with stable strongest/weakest selection.
- Classified weak and mastered vocabulary without allowing successful deferred retries to overwrite first-attempt learning evidence.
- Added deterministic recommendations for failed attempts, passed attempts with weak vocabulary, and clean passes/mastery.
- Extracted and wired the live `LessonSummary` component into `LessonView`, including actionable retry/continue controls.
- Added domain and component coverage for retry-safe metrics, failure, pass-with-weak-items, clean mastery, actual time/XP, and rendered navigation.
- Clean install completed with 520 packages installed and 521 audited; the existing audit reports 6 dependency vulnerabilities (1 moderate, 5 high) outside this milestone.
- Full validation passed: type-check, lint, 25 test files / 100 tests, content validation with 12 modules and 60 lessons / 0 errors / 0 warnings, production build with 99 static pages, and `git diff --check`.
- No Supabase migration, production data, environment, Vercel setting, or secret action was performed.
- Committed status commit `ea76d0095c056133a3ff32cf65ad4b1de4df94c0`, pushed the sole branch, and opened pull request #94: https://github.com/OBM-OPC/slogovo/pull/94
- Confirmed PR #94 is non-draft and mergeable with no requested changes.
- GitHub Actions validation run `29259935058` and the Vercel preview deployment completed successfully for PR head `ea76d00`.

### Work remaining

- Commit and push this final status update.
- Verify the resulting final PR head receives green GitHub Actions and Vercel checks.
- Squash-merge PR #94 and delete the branch only if every automatic-merge condition remains satisfied; otherwise stop and report the blocker.

### Commands executed in this run

- Local Git status, branch, worktree, lock, process, and remote inspections.
- OpenClaw cron state inspection and temporary disablement to prevent overlapping coding runs.
- GitHub inspection of all branches, open pull requests, all 19 open issues and bodies, and latest Actions runs.
- Read-only source, content, test, workflow, and prior status inspection.
- `git switch -c feat/phase-2-performance-summary`.
- Focused Vitest runs for `src/lib/lesson-summary.test.ts` and `src/components/lesson/LessonSummary.test.tsx` (6 tests passed in the final focused run).
- `npm ci` (520 packages installed; 521 audited).
- `npm run type-check` (passed).
- `npm run lint` (passed with no warnings or errors).
- `npm test` (25 test files and 100 tests passed).
- `npm run validate:content` (12 module files and 60 lesson files; 0 errors and 0 warnings).
- `npm run build` (passed; content validation ran first and 99 static pages were generated).
- `git diff --check` (passed).
- `git commit -m "feat: show real lesson performance summary"`.
- `git commit -m "docs: update controlled development status"`.
- `git push -u origin feat/phase-2-performance-summary`.
- `gh pr create --base main --head feat/phase-2-performance-summary` (opened #94).
- `gh pr view 94` and `gh pr checks 94 --watch` (non-draft/mergeable, Actions and Vercel green for `ea76d00`).

## Run state

- Current branch: `feat/phase-2-alternative-retries`, based on `main` commit `e726fa474cb5be78c9f98d7f6c65db0426d69d80`.
- Current branch head before this status update: `0e1827ac5688965adf4b9d869a4cc82504b47a07`.
- Implementation commit: `142ccc277840d9548bad9833f2cce935bc59ab25`.
- Remote branches: `main` and the single implementation branch `feat/phase-2-alternative-retries`.
- Open pull requests: #93 is the single implementation pull request.
- Latest GitHub Actions result: post-merge `main` CI run `29254751588` completed successfully for `e726fa4`.
- Pull request CI: run `29256158405` completed successfully for PR head `0e1827a`.
- Vercel status: preview deployment for PR head `0e1827a` and the prior production deployment for `e726fa4` completed successfully.
- Concurrent-run check: no additional worktree, Git lock, visible Slogovo session, Slogovo coding process, or running development cron invocation was found. Session visibility is restricted to the current session tree.
- Supabase status: local migrations remain unchanged; no production migration, data, environment, or secret action is in scope.

## Backlog audit

All 19 open issues were inspected: #71, #70, #69, #68, #67, #66, #65, #64, #63, #62, #61, #35, #34, #33, #32, #31, #30, #29, and #28.

Priority order:

1. #71 remains the explicit first assignment spanning the Phase 1/2 learning foundation.
2. #28 and #29 contain the remaining Phase 1/2 tracker criteria.
3. #70, #67, #68, #65, and #66 are cross-cutting delivery, database, architecture, and testing safeguards.
4. #30–#35 and #61–#69 are later product phases or broader cross-cutting work.

## Selected milestone

Selected issue: #29 — Phase 2 lesson scoring around mastery.

Reasoning: PRs #91 and #92 established structured exercise results, real first-attempt scoring, passing gates, historical attempts, filesystem-complete content validation, and all-wrong protection. The highest-priority concrete Phase 2 gap is now the explicit requirement that wrong answers enter a temporary queue and return later through a different exercise type. The merged retry flow keeps the original type, and matching mistakes can be omitted from deferred practice after the learner corrects them inside the same matching run.

Scope:

- Queue every wrong required item once per run even when it is corrected immediately inside a matching exercise.
- Convert recognition mistakes (`quiz`, `matching`) into a productive `fill-in` retry.
- Convert productive/listening mistakes (`fill-in`, `sentence-builder`, `listen`) into a scaffolded `quiz` retry.
- Preserve the original exercise ID and item ID so first-attempt scoring, required-item gates, history, and idempotent synchronization continue to address one logical item.
- Keep the existing maximum of three deferred attempts.
- Add focused tests for alternative-type conversion, matching mistake retention, passing retries, and the retry limit.

Out of scope:

- New exercise UI components, content rewrites, scoring-threshold changes, production database changes, environment changes, later phases, and issue closure beyond fully verified criteria.

Dependencies:

- `src/lib/lesson-flow.ts`, the structured result model in `src/types/learning.ts`, and the existing rendered exercise types in `ExerciseEngine`.

Risks:

- Synthetic retries must remain compatible with the existing exercise component data contracts.
- The transformed result must retain stable logical IDs or required-item gates could misclassify a corrected mistake as a different item.
- Matching records multiple selections inside one screen; local corrections must not consume the deferred retry budget.

Acceptance criteria for this increment:

- Every wrong required item returned by an exercise run produces at most one deferred retry.
- The retry exercise type differs from the run that produced the mistake and is renderable by `ExerciseEngine`.
- Retry results preserve the original exercise ID and item ID.
- A passing retry produces no further retry; a failing retry stops after attempt three.
- Matching mistakes remain queued even when corrected before the matching screen completes.
- Type-check, lint, unit tests, content validation, production build, GitHub Actions, and Vercel preview pass.
- Exactly one implementation branch and one reviewable pull request are used.

## Work completed

- Completed the required preflight against local Git, GitHub branches, all open pull requests, all open issues, the latest Actions run, Vercel commit status, cron state/history, visible sessions, processes, worktrees, and Git locks.
- Confirmed PR #92 was squash-merged as `e726fa4`, its branch was deleted, and post-merge CI and Vercel production checks passed.
- Audited the merged Phase 1/2 implementation and selected the alternative-type mistake retry gap from #29.
- Created the single implementation branch `feat/phase-2-alternative-retries`.
- Changed retry generation so each wrong required item produces at most one deferred retry even when a matching item is corrected inside the same screen.
- Added renderable alternative retry conversion: quiz/matching mistakes become fill-in items; fill-in/sentence-builder/listen mistakes become quiz items.
- Preserved the original exercise and item IDs across transformed retries and retained the three-attempt limit.
- Kept matching selections inside one screen on the same lesson-flow attempt number so immediate correction does not consume the deferred retry budget.
- Generalized the fill-in prompt and placeholder so transformed answers can validly be Bulgarian, German, or numeric.
- Added unit coverage for all supported source exercise types, matching mistake retention, passing retries, optional items, stable IDs, and the retry limit.
- Added component coverage proving a wrong-then-correct matching interaction retains attempt number one for both selections.
- Full validation passed: type-check, lint, 24 test files / 95 tests, content validation with 12 modules and 60 lessons / 0 errors / 0 warnings, and production build with 99 generated static pages.
- Committed and pushed implementation commit `142ccc277840d9548bad9833f2cce935bc59ab25`.
- Opened pull request #93: https://github.com/OBM-OPC/slogovo/pull/93
- Confirmed PR #93 is non-draft and mergeable, with no reviews requesting changes.
- Confirmed GitHub Actions run `29256158405` and the Vercel preview succeeded for PR head `0e1827a`.

## Work remaining

- Verify the documentation-only final status commit receives green GitHub Actions and Vercel checks.
- Squash-merge PR #93 and delete the implementation branch if the final head remains clean, non-draft, mergeable, and free of requested changes.

## Commands executed

- Local Git status, branch, worktree, lock, log, and process inspections.
- Read-only GitHub API queries for all branches, open pull requests, all 19 open issues and their bodies, Actions runs, commit checks, and Vercel commit status.
- Read-only OpenClaw cron and visible-session inspections.
- Read-only source, content, configuration, workflow, test, schema, and documentation audits.
- `gh` and `rg` were unavailable, so authenticated GitHub API queries and `grep`/`find` were used.
- `git switch -c feat/phase-2-alternative-retries`.
- Focused Vitest runs for `src/lib/mistake-queue.test.ts` and `src/components/quiz/MatchingExercise.test.tsx` (9 tests passed in the final focused run).
- `npm run type-check` (passed).
- `npm run lint` (passed with no warnings).
- `npm test` (24 test files and 95 tests passed).
- `npm run validate:content` (12 module files and 60 lesson files; 0 errors and 0 warnings).
- `npm run build` (passed; content validation ran first and Next.js generated 99 static pages).
- `git diff --check` (passed).
- `git commit -m "feat: vary deferred mistake retries"`.
- `git push -u origin feat/phase-2-alternative-retries`.
- Authenticated GitHub API pull-request creation for #93.
- GitHub API inspection of PR state, reviews, check runs, commit statuses, and Actions runs.
