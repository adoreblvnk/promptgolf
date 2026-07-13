# Design

## Overview

PromptGolf uses a compact graphite product shell inspired by mature online judges without copying any one platform. Product routes should feel like evaluation infrastructure: dense problem tables, split workspaces, submission timelines, technical logs, and restrained golf scoring.

The landing page may remain more expressive. Inner routes are the calm instrument; golf appears in round, par, strokes, handicap, and scorecard moments rather than decorative imagery behind work.

## Color palette

Use OKLCH tokens and Tailwind arbitrary values where needed.

- Page background: graphite `oklch(0.145 0.008 265)`, exposed as `paper`.
- Card surface: `oklch(0.18 0.009 265)`, exposed as `card`.
- Primary ink: `oklch(0.93 0.008 260)`, exposed as `ink`.
- Secondary ink: `oklch(0.74 0.012 260)`, exposed as `ink-soft`.
- Muted ink: `oklch(0.59 0.012 260)`, exposed as `ink-muted`.
- Rules: white alpha at 10-20%, exposed as `rule` and `rule-strong`.
- Primary golf/submission accent: amber `oklch(0.72 0.16 58)`.
- Pass and under-par: green `oklch(0.7 0.15 150)`.
- Failure and over-par: red `oklch(0.67 0.19 25)`.

Avoid gradient text, glossy glass panels, neon glows, decorative gradients, and soft shadows.

## Typography

- Use Inter for product UI and IBM Plex Mono for scores, labels, telemetry, prompt text, test IDs, and run metadata.
- Product-route headings are compact, generally 20-28px. Keep tracking no tighter than `-0.04em`.
- Body copy should sit around 13-15px with max widths around 65-75ch.
- Metadata labels can use uppercase mono, but do not let every small label become an eyebrow.
- Keep the voice terse and test-minded. The product should sound like it was built by people who ship software.

## Components

- App shell: matte graphite canvas with no decorative grid behind task surfaces.
- Navigation: 52px top bar with a small `PG` mark, route-aware destinations, and compact player context.
- Panels: 4-6px radius, 1px separators, no decorative shadows or blur.
- Product lists: tables or high-density rows, never card galleries.
- Score pills: high-contrast numeric score plus hidden-test and prompt-count summary.
- Run cards: comparative evidence cards with public/hidden/UX mini-metrics.
- Prompt runner: large monospaced textarea with one obvious submit action, disabled/loading/error states, and copy that explains the live run path.
- Live run view: generated app preview first, Playwright checks beside it, streaming log below.
- Timeline: stage list communicates sandbox/build/evaluation progress; each item includes status detail, not just decoration.
- Generated-app preview: schematic or live checkout preview is acceptable, but it must be labeled as generated evidence.

## Layout

- Use a centered max-width shell (`max-w-7xl`) with 16-32px horizontal padding.
- Landing page rhythm alternates hero, live pipeline proof, and primary challenge CTA.
- Challenge detail uses a full-height brief/spec split with independent scrolling on desktop and an explicit Problem/Solve switch on mobile.
- Live run pages prioritize generated app evidence, then test results, then logs.
- Seeded run pages prioritize score evidence first, then tests, then sandbox timeline.
- Tables and rankings should remain readable on mobile by stacking cells instead of forcing horizontal scroll when practical.

## Motion

- Motion is limited to stateful hover/active feedback, small arrow translations, and live-test replay highlights.
- Durations should stay around 150-250ms for product surfaces.
- Include reduced-motion handling globally: disable nonessential transitions and smooth scrolling when users prefer reduced motion.

## Accessibility

- Maintain visible focus outlines through shadcn/Tailwind ring tokens.
- All prompt and form controls need accessible names.
- Avoid using color alone for pass/fail; pair status color with icons/text.
- Ensure touch targets are at least 44px for primary navigation and submission controls.
