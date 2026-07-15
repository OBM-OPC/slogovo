# Slogovo brand guidelines

## Identity

Slogovo is calm, practical, and encouraging. The visual language combines Bulgarian green with warm paper neutrals and restrained gold. Red is reserved for errors and destructive actions.

The custom mark is a rounded green tile with a white Cyrillic-inspired `С` and a gold learning point. Use `BrandLogo` in headers and branded account surfaces; use `BrandGlyph` only where space is constrained. Do not redraw or recolor the mark per screen.

## Palette

- Primary: `#2D6A4F` (actions, focus, progress)
- Secondary: `#D4A574` (milestones, warmth)
- Neutral background: `#FAF8F5`; foreground: `#1E1A16`
- Success: `#276749`; warning: `#8A5A24`; danger: `#B42318`

Semantic colors must pass WCAG AA and must be paired with text or an icon.

## Type

- Inter: body copy, labels, controls, and numeric information.
- Lora: headings and Bulgarian display text.

Both are self-hosted by Next.js at build time. No third font family is introduced.

## Illustration and pattern

Product illustrations use simple SVG shapes from the same green/gold/red palette. The initial set covers empty learning states, achievements, and onboarding. They are decorative and hidden from assistive technology when surrounding copy already communicates the meaning.

Background patterns use at most 4% opacity. They provide depth without competing with learning content.

## Motion

Motion communicates state changes: entering content, progress, feedback, or achievement. It is 300 ms or less for interactions; soft progress emphasis may repeat. Decorative motion is avoided, and `prefers-reduced-motion` globally disables non-essential transitions and animation.

## Product assets

- Header/account logo: `src/components/brand/BrandMark.tsx`
- Favicon/PWA icon: `src/app/icon.svg`
- PWA identity: `src/app/manifest.ts`
- Social preview: `src/app/opengraph-image.tsx`
