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
- Unverified transliteration must stay out of production content. The validator
  rejects `NATIVE_REVIEW_NEEDED` and `needsNativeReview: true` markers.

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
- [ ] A1 items have a verified, non-empty `bgLatin`.
- [ ] `pronunciationHint` is used instead of inventing pronunciation rules.
- [ ] No Bulgarian grammar claims are made without native review or source reference.

## Coverage report

Run `npm run content:report` for the author-facing inventory. The same report is
printed by `npm run validate:content` and therefore by every production build.

The report treats vocabulary as tested when an exercise explicitly references
its stable `vocabularyId` or uses its Bulgarian form in an answer, option,
matching pair, sentence, or listening prompt. Authored audio means an `audio`
path on vocabulary or an `audioUrl` on a listening item; runtime TTS fallback is
useful, but does not count as reviewed source audio. Productive practice means a
fill-in, sentence builder, typed listening answer, dictation, or listening
reorder task.

Coverage gaps are inventory findings, not silent validation failures. Authors
receive exact file paths and affected stable IDs for untested vocabulary,
missing audio, missing accepted answers, unsupported exercise types, duplicate
IDs, missing grammar explanations, and lessons without productive exercises.
Structural content errors still fail validation as before.
