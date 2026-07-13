-- Preserve the learner-facing evaluation category separately from pass/scoring status.
-- This keeps rich feedback queryable without changing the existing scoring contract.

alter table public.exercise_results
  add column if not exists feedback_status text;

alter table public.exercise_results
  drop constraint if exists exercise_results_feedback_status_check;
alter table public.exercise_results
  add constraint exercise_results_feedback_status_check
  check (
    feedback_status is null or feedback_status in (
      'correct',
      'correct_with_typo',
      'accepted_variant',
      'partially_correct',
      'wrong_form',
      'wrong_word',
      'missing_word',
      'incorrect'
    )
  );
