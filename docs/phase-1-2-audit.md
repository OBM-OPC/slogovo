# Phase 1 and Phase 2 repository audit

This is the canonical audit and implementation map for GitHub issue #71. It
describes the current Slogovo repository and the Phase 1/2 changes already
implemented on `main` and the complete-backlog branch.

## Course-content architecture

- `content/<level>/module-<n>/meta.json` defines module order, thresholds, and
  its lesson list. Each lesson lives beside it under `lessons/lektion-<n>.json`.
- `src/lib/content.ts` is the runtime registry used by statically generated
  lesson, module, vocabulary, and grammar routes.
- `src/lib/content-inventory.ts` independently walks every content JSON file.
  Registry drift therefore cannot hide an unimported or deleted lesson.
- `src/lib/content-validation.ts` validates structure, IDs, authored answers,
  grammar, required exercise groups, and supported types.
- `src/lib/content-quality.ts` reports coverage, audio, productive-practice,
  accepted-answer, duplicate-ID, grammar, and unsupported-type gaps for authors.
- `scripts/validate-content.ts` combines filesystem inventory, registry drift,
  structural validation, grammar validation, and the quality report. It runs at
  the start of every production build.

The current inventory is 12 modules, 60 lessons, 554 vocabulary items, 315
exercise items, and 9 grammar topics.

## Lesson and exercise data flow

1. The lesson route resolves authored content through `content.ts` and renders
   `LessonView`.
2. `ExerciseEngine` dispatches an authored exercise to quiz, matching, fill-in,
   sentence-builder, or listening UI. Each UI records one structured
   `ExerciseItemResult` per answer and returns an `ExerciseResult`.
3. `LessonView` keeps all results, turns failed required items into a different
   retry format through `lesson-flow.ts`, tracks active rather than fixed time,
   and passes the final results to `createLessonAttempt`.
4. `evaluation.ts` calculates first-attempt metrics and applies completion,
   required-score, all-wrong, required-item, productive, and required-group
   gates. `lesson-attempts.ts` creates the complete calculated attempt.
5. `useProgressStore.recordLessonAttempt` updates the local aggregate once per
   attempt ID, persists a merge-safe progress snapshot, and queues the granular
   attempt using a stable device/event ID.
6. `/api/sync` verifies the user and parses a bounded batch. `sync-server.ts`
   loads the repository lesson, and `server-attempt-validation.ts` maps every
   exercise/item ID back to authored answers and recalculates correctness,
   feedback, required/productive flags, duration, score, pass, mastery, and XP.
7. The server upserts the authoritative attempt and item rows using
   `(user_id, client_event_id)` idempotency. Failed events remain queued for
   retry. `user_progress` remains a merge-safe read cache, not evidence of pass.

## Where correctness was lost

The pre-Phase-2 flow (visible immediately before foundation commit `a6ad2f9`)
discarded correctness at three boundaries:

- exercise components called `onComplete()` without returning item answers;
- `LessonView` incremented `exerciseScore` once for every completed exercise
  block, even when its answers were wrong;
- reaching the final screen called `completeLesson` and credited a fixed 15
  minutes and all lesson vocabulary without a score, pass gate, or attempt.

`addExerciseResult(boolean)` separately updated lifetime counters, so that
boolean could not be connected to a lesson, exercise, item, answer, retry, or
completion decision. A learner could therefore answer every question
incorrectly, click through every block, and still complete the lesson.

Those loss points are closed by the structured item/result/attempt flow above.
The client calculation is provisional; only the content-backed server rebuild
is authoritative. The aggregate `user_progress` snapshot intentionally omits
per-item evidence and must never be queried as proof of correctness. Sparse
`vocabularyId` attribution and the course-coverage gaps in `content:report` are
known content-quality limitations, not silent pass signals.

## Calculation ownership

| Value | Calculation owner | Persistence/use |
| --- | --- | --- |
| Item correctness and feedback | `answer-evaluation.ts`; server replay in `server-attempt-validation.ts` | `exercise_results` |
| Exercise totals | `buildExerciseResult` in `evaluation.ts` | nested attempt plus item rows |
| Lesson screen completion | `LessonView.finishAttempt`; does not imply pass | `lesson_attempts.completed` |
| Accuracy and score | first logical attempts in `calculateLessonMetrics` | attempt row and best-score aggregate |
| Pass | `evaluateLessonOutcome` gates score, all-wrong, required items/groups, and productive work | `lesson_attempts.passed`; completed lesson aggregate only when true |
| Mastery | pass plus score/accuracy threshold in `evaluateLessonOutcome` | `lesson_attempts.mastered` and `masteredLessons` |
| XP | `createLessonAttempt`: zero on failure, score-derived on pass | `lesson_attempts.xp_earned`; lesson summary |
| Active study time | `active-time.ts` in `LessonView`; pauses idle/hidden time | attempt duration and daily aggregate |
| Streak | `updateStreakForDate` after positive active study | local/remote progress aggregate |
| Module completion | `recordLessonAttempt` after every module lesson has passed | completed module aggregate |
| Achievements | `checkAchievements` from calculated progress metrics | achievements aggregate |

The server repeats all attempt calculations before writing granular history, so
client-submitted score, pass, mastery, XP, answers, and duration are not trusted.

## Supported and unsupported exercises

Authored lesson content supports `quiz`, `matching`, `fill-in`,
`sentence-builder`, and `listen`. Listening supports selection, typed answers,
dictation, reorder, and audio-comprehension formats. Alternative retry screens
may submit a selection exercise as fill-in or a productive/listening exercise
as quiz; other type changes are rejected by the server.

`typing` is a vocabulary-trainer result type, not an authored lesson exercise
type. Any future/unknown lesson type is reported by `content:report` and rejected
by structural validation. The current course has zero unsupported types, but it
also has no authored listening exercise, a known Phase 7 gap.

## Content inconsistencies

Phase 1 corrected the Russian landing-page suffix, inaccurate present-tense
`съм` guidance, incomplete grammar/reference validation, A1 transliteration
requirements, and unresolved native-review placeholders. Structural validation
currently reports 0 errors and 0 warnings.

The author report records the remaining non-blocking quality backlog: 299
vocabulary items are not referenced by lesson exercises, all 554 vocabulary
items lack reviewed authored audio, and 37 lessons lack productive practice.
It currently finds 0 missing accepted-answer sets, unsupported exercise types,
duplicate stable IDs, or missing grammar explanations.

## Target models

The proposed models are implemented in `src/types/learning.ts`:

- `ExerciseItemResult`: stable ID, authored item ID, evaluation/pass status,
  submitted and accepted answers, rich feedback, timing, attempt number, hints,
  required/productive flags, and optional vocabulary attribution.
- `ExerciseResult`: stable exercise ID/type, nested item attempts, calculated
  correct/incorrect counts, hints, and timestamps.
- `LessonAttempt`: stable user/lesson/module identity, complete nested results,
  active time, first-attempt metrics, required score, separate `completed`,
  `passed`, and `mastered` states, accuracy, score, and XP.

This separates reaching the final screen from passing and preserves enough
evidence to recalculate every derived value.

## Database migration plan and status

The proposed additive migrations are implemented locally in timestamp order:

- canonical `user_progress` aggregate with RLS;
- historical `lesson_attempts` and item-level `exercise_results` with RLS;
- vocabulary-review/daily/offline event tables and idempotency columns;
- mastery, score, active-time, count, threshold, and recorded-attempt fields;
- hardened database helper permissions;
- stable device IDs and usable idempotency indexes;
- queryable rich answer-feedback status.

`validate:database` enforces migration order, destructive-change review markers,
RLS, and generated database-type coverage. Applying these migrations to
production remains an owner-controlled operation and was not performed here.

## Verification evidence

- `content-validation.test.ts`, `content-inventory.test.ts`, and
  `content-quality.test.ts` cover structural and coverage reporting.
- `evaluation.test.ts` proves all-wrong attempts fail, below-threshold attempts
  fail, required/productive/group gates work, and successful retries do not
  inflate first-attempt score.
- `server-attempt-validation.test.ts` and `sync-server.test.ts` prove omitted or
  forged results are rejected/recalculated and duplicate sync is idempotent.
- `LessonSummary.test.tsx` and `LessonView.test.tsx` cover failure and retry UI.
- Playwright covers a fully failed lesson, a recovered required-item retry, and
  progress restoration in a clean second browser context.

Together these checks prove that clicking every screen or answering every item
incorrectly cannot pass or master a lesson.
