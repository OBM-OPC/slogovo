# Slogovo design system

Slogovo uses a 4 px spacing grid, semantic color tokens, two font roles, consistent rounded surfaces, and purpose-driven motion. The source components and their interactive examples live in `src/components/ui` and Storybook.

## Commands

- `npm run storybook` starts the local component workshop.
- `npm run build:storybook` creates the static, production-style component catalog.

## Tokens

### Color

- `primary`: the Bulgarian-green product action and focus color.
- `accent` / `danger`: destructive actions and errors, never neutral decoration.
- `gold` / `warning`: attention, goals, and in-progress states.
- `success`: verified correct/completed states.
- `warm`: neutral surfaces and text hierarchy.

Text and controls must meet WCAG AA. Semantic state must never rely on color alone; pair it with text, an icon, or both.

### Typography

- Body/UI: Inter with Noto Sans Cyrillic fallbacks.
- Headings: Playfair Display/Noto Serif fallbacks.
- Bulgarian text carries `lang="bg"` and uses the Cyrillic fallback stack.
- Heading and body line heights are defined by the Tailwind typography utilities used in components; body copy defaults to at least 1.5.

### Spacing

Use the Tailwind scale on a 4 px base: 1 (4), 2 (8), 3 (12), 4 (16), 5 (20), 6 (24), 8 (32), 10 (40), 12 (48), 16 (64). Prefer `gap-*` and container padding over one-off margins.

### Shape, elevation, and motion

- Inputs and actions: 12–16 px radius.
- Cards and dialogs: 20–24 px radius.
- `shadow-card` for resting surfaces; `shadow-card-hover` only for interactive/elevated states.
- Feedback transitions are 300 ms or less. The global reduced-motion rule disables non-essential animation.

## Components

- Button: primary, secondary, ghost, danger, link, outline, and legacy accent variants; loading and disabled states.
- Card: default, interactive, and highlighted variants with header/title/description helpers.
- Input: label required; hint, error, disabled, and loading states.
- Badge: neutral and semantic tones.
- Progress: accessible linear and circular indicators with custom label slots.
- Dialog: modal, alert, and confirm semantics; focus trap, Escape, overlay close, and focus restoration.
- EmptyState: illustration, heading, description, and action slots.
- Skeleton: text, card, list, and learning-page variants.
- Toast: auto-dismiss, persistent, action, semantic tone, and manual dismissal.
