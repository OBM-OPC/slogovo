## Findings

<!-- Describe current behavior, evidence, and the root cause. -->

## Proposed implementation

<!-- Describe the smallest complete solution and its data flow. -->

## Risks

<!-- Include migration, compatibility, privacy, learning-quality, and rollout risks. -->

## Implementation

<!-- List the implemented behavior and any intentionally excluded work. -->

## Validation

- [ ] Type-check
- [ ] Lint
- [ ] Unit/domain tests
- [ ] Component tests
- [ ] End-to-end tests, or a documented reason they do not apply
- [ ] Content validation
- [ ] Production build

## Manual test instructions

<!-- Give reproducible steps and expected results, including errors and recovery. -->

## Learning-domain review checklist

- [ ] Strict TypeScript and explicit domain types; no new `any` or unchecked casts
- [ ] Inputs use shared bounded schemas and stable IDs
- [ ] Authoritative scores, pass/mastery, XP, and progress mutations are verified server-side
- [ ] No duplicated scoring or answer-checking logic in UI components
- [ ] Errors are typed and operational failures are logged structurally without answer or personal-data payloads
- [ ] No silent catches in authoritative learning flows
- [ ] No fake statistics, fixed study durations, or client-provided scores are trusted
- [ ] Database changes are additive, migrated, RLS-reviewed, and reflected in generated types

## Remaining work

<!-- Link follow-up issues, owner decisions, production steps, and blockers. -->

> Do not mark this work complete merely because the UI exists. Data flow, persistence,
> scoring, error states, and relevant tests must all be functional and verified.
