-- Preserve whether a vocabulary review tested recognition or productive recall.
-- Existing and older-client events remain recognition practice by default.

alter table public.vocabulary_review_events
  add column if not exists practice_mode text not null default 'recognition';

alter table public.vocabulary_review_events
  drop constraint if exists vocabulary_review_events_practice_mode_check;
alter table public.vocabulary_review_events
  add constraint vocabulary_review_events_practice_mode_check
  check (practice_mode in ('recognition', 'production'));
