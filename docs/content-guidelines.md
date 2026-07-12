# Slogovo Content Guidelines

Scope: Slogovo only. Do not reference the old LLB application.

## Transliteration policy

- `bgLatin` is an **approximate Latin-script reading aid** for learners who cannot read Cyrillic yet.
- It is **not** a substitute for learning Cyrillic.
- It must not invent phonetic values that do not exist in standard Bulgarian.
- Use a consistent Latin mapping across all content.

## When `bgLatin` is required

- Required for A1 content until the learner explicitly disables Latin script in settings.
- Optional for A2+ once the learner is assumed to read Cyrillic.
- If a native speaker has not verified the transliteration, set `bgLatin: "NATIVE_REVIEW_NEEDED"`.

## `pronunciationHint`

- Use `pronunciationHint` for German-language guidance about stress, silent letters, or difficult sounds.
- Example: `"Betonung auf der zweiten Silbe"` or `"Das 'ъ' ist ein kurzer Mittellaut"`.
- Do **not** fabricate Bulgarian grammar explanations; mark uncertain content with `needsNativeReview: true`.

## Audio policy

- `audio` is a path/URL to pre-generated audio.
- Set `audioGenerated: true` only after the audio has been generated and reviewed.
- If audio is missing, omit the field; do not ship silent placeholders.

## Verification checklist

- [ ] Every vocabulary item has a non-empty `bg` and `de`.
- [ ] A1 items have a non-empty `bgLatin` or `NATIVE_REVIEW_NEEDED` placeholder.
- [ ] `pronunciationHint` is used instead of inventing pronunciation rules.
- [ ] No Bulgarian grammar claims are made without native review or source reference.
