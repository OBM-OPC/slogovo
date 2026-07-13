# Progress dashboard metrics

The progress dashboard avoids lifetime click totals and reports actionable learning state.

- Active study time comes from measured daily active seconds, with legacy measured minutes as a compatibility fallback.
- Passed and mastered lessons remain separate; reaching the final screen is not either metric.
- Due vocabulary uses the persisted next-review date.
- Receptive and productive vocabulary mastery each require at least three attempts and 70% accuracy in that mode.
- Grammar skill levels use the authoritative best lesson score attached to each lesson's grammar topic.
- Listening performance aggregates unique first attempts from authenticated lesson-attempt records.
- Weak areas require at least two first attempts and less than 70% accuracy, preventing one answer from becoming a misleading diagnosis.
- Recent improvement compares up to five recent scored attempts with the preceding five and remains empty until each group has at least two attempts.

The authenticated insights endpoint returns only score, time, and aggregated exercise-type counts. It does not return user answers, accepted answers, feedback text, or personal identifiers. The UI has separate loading, no-data, partial-error/retry, and populated states.
