# Adaptive daily learning

The primary **Heute lernen** action on `/lernen` opens one bounded learning sequence on `/heute-lernen`. The route renders a plan created entirely by `buildDailyPlan`; the planner has no dependency on React, routing, or browser APIs.

## Planning inputs and priority

The planner combines these signals in priority order:

1. overdue vocabulary reviews, oldest due date first;
2. recent mistakes and weak vocabulary accuracy;
3. recently reviewed material;
4. grammar from lessons scored below 70 percent;
5. a limited number of new words;
6. listening and productive-recall variants;
7. optional speaking variants when speaking practice is enabled.

The learner's daily-goal duration sets the maximum sequence size. A review backlog above the configured threshold caps new vocabulary at three items so new material cannot compound an already large backlog. The plan reserves at least one listening, productive, grammar, and (when enabled) speaking slot before filling remaining time in priority order.

## Recognition and production

Vocabulary progress keeps recognition and production correct/total counters separately. Flashcard-style recall records recognition; typed Bulgarian recall records production. The sync event stores `practice_mode`, and merge logic preserves the strongest counters observed on either device.

The planner advances a word from recognition to production after at least three recognition attempts at 70 percent accuracy. Once production evidence exists it continues to schedule productive recall. Older progress without separate counters falls back to the legacy aggregate accuracy so existing learners are migrated gradually rather than reset.

## Verification

`src/lib/planner.test.ts` exercises planning independently from the interface, including priority, backlog capping, modality selection, grammar, recent material, and optional speaking. Component tests verify typed recall is recorded as production. The browser journey verifies the dashboard's primary action reaches an enabled adaptive session.
