# Lesson interface and accessibility

The lesson interface is designed for narrow mobile screens first and retains the same learning state on desktop.

## Interaction states

- Answer controls expose selection through `aria-pressed` and announce correct, incorrect, matched, and completed states in addition to color.
- Typed Bulgarian answers use labelled fields, native Cyrillic language metadata, disabled/read-only answer states, and live feedback.
- The optional Bulgarian keyboard helper inserts the characters German keyboards most often hide without replacing the device keyboard.
- Audio actions expose loading and failure states, keep normal and slow playback separate, and remain at least 44 CSS pixels high where text controls are used.
- Progress bars use native progress semantics. Success and error messages use polite status or assertive alert announcements as appropriate.

## Resilience

- Route transitions display a screen-reader-labelled skeleton.
- Empty review, mistake, and vocabulary modes show an explanation and a useful next action.
- The global route error boundary offers a retry without transmitting exception text or personal data.
- Answer controls remain keyboard operable; Enter submits typed answers and listening shortcuts ignore active text fields.

## Motion and viewport policy

The global `prefers-reduced-motion: reduce` rule collapses animation and transition duration, disables smooth scrolling, and the confetti implementation opts out for reduced-motion users. Touch controls use manipulation semantics and focus-visible rings. Browser coverage exercises a 360-pixel viewport, Bulgarian character insertion, and horizontal overflow detection.
