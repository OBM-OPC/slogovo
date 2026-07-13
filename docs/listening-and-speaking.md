# Listening and speaking architecture

## Listening formats

The declared `listen` exercise is rendered by `ListenExercise` and evaluated through the same structured result pipeline as every lesson exercise. Its five supported formats are:

- `listen-select`: choose the matching vocabulary answer;
- `listen-type`: type a word or short answer;
- `dictation`: type the complete spoken sentence, including authored variants;
- `listen-reorder`: reconstruct the spoken phrase;
- `audio-comprehension`: answer a question without displaying the transcript.

Typed formats use the shared Bulgarian answer evaluator. All formats emit stable item IDs, correctness, accepted answers, duration, attempt number, required/productive flags, and optional vocabulary IDs.

## Audio source order

Every item supports normal and slow playback. The runtime tries sources in this order:

1. a previously cached authored recording;
2. the authored native recording (or authored slow recording);
3. an optional app-bundled/downloaded offline recording;
4. remote/browser TTS as the final fallback.

When no slow recording exists, normal audio plays at a reduced rate. The same reduction is applied to TTS. Successfully played authored recordings are opportunistically stored in the versioned `slogovo-audio-v1` Cache Storage cache. `audioCacheKey` keeps that cache stable when a source URL is signed or versioned.

The UI keeps the transcript hidden, reports loading and terminal failure visibly, labels the source actually used, and supports only explicitly authored hints. `maxReveals` is validated and defaults to one when a `revealText` exists.

The content-quality report intentionally continues to list listening items without `audioUrl`: TTS makes them runnable, but it does not count as authored native audio.

## Speaking attempts

Daily learning now includes a speaking/self-review step. It plays the target, asks the learner to repeat it, and clearly states that no automated pronunciation score is being assigned.

The future-facing `SpeakingAttempt` model can retain a transcript, recognition confidence, audio reference, and an exact/partial/none/unavailable phrase match. It always records `pronunciationAssessment: "not-evaluated"`. Transcript matching can support later speech-recognition feedback, but must never be presented as phoneme-level or pronunciation scoring.
