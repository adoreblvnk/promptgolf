# Design

## Overview

PromptGolf uses a paper scorecard aesthetic: warm paper, cool ink, thin rules, compact data panels, and a sharp vermilion accent. It should feel like a serious benchmark printed on a judging sheet, not a dark devtool, generic AI SaaS page, or classroom prompt tutorial.

The current code is the design source of truth. Preserve the light paper direction unless the product explicitly chooses a redesign.

## Color palette

Use OKLCH tokens and Tailwind arbitrary values where needed.

- Page background: `oklch(0.965 0.008 90)`, exposed as `paper`.
- Card surface: `oklch(0.992 0.004 90)`, exposed as `card`.
- Primary ink: `oklch(0.23 0.022 268)`, exposed as `ink`.
- Secondary ink: `oklch(0.43 0.018 268)`, exposed as `ink-soft`.
- Muted ink: `oklch(0.56 0.012 268)`, exposed as `ink-muted`.
- Rules: ink alpha at 16-32%, exposed as `rule` and `rule-strong`.
- Primary accent: vermilion `oklch(0.46 0.2 30)` for CTAs, failing checks, and provocative copy.
- Pass state: green `oklch(0.5 0.13 152)` with a pale soft fill.
- Warning state: amber `oklch(0.74 0.15 72)` with a pale soft fill.

Avoid gradient text, glossy glass panels, neon glows, and dark-console surfaces unless the whole system is intentionally redesigned.

## Typography

- Use Inter for product UI and IBM Plex Mono for scores, labels, telemetry, prompt text, test IDs, and run metadata.
- Headings are large, compact, and direct. Keep tracking no tighter than `-0.04em`.
- Body copy should sit around 16-18px with 1.6 line-height and max widths around 65-75ch.
- Metadata labels can use uppercase mono, but do not let every small label become an eyebrow.
- Keep the voice terse and test-minded. The product should sound like it was built by people who ship software.

## Components

- App shell: warm paper canvas with a faint evaluation grid. The shell should feel tactile, not sterile.
- Navigation: sticky top bar with a small square `PG` mark, compact route links, and one clear demo CTA.
- Panels: one restrained raised-surface vocabulary: 8-10px radius, 1px translucent ink border, very small shadows, no decorative blur.
- Cards: use paper/card contrast, thin dividers, and dense but readable evidence blocks.
- Score pills: high-contrast numeric score plus hidden-test and prompt-count summary.
- Run cards: comparative evidence cards with public/hidden/UX mini-metrics.
- Prompt runner: large monospaced textarea with one obvious submit action, disabled/loading/error states, and copy that explains the live run path.
- Live run view: generated app preview first, Playwright checks beside it, streaming log below.
- Timeline: stage list communicates sandbox/build/evaluation progress; each item includes status detail, not just decoration.
- Generated-app preview: schematic or live checkout preview is acceptable, but it must be labeled as generated evidence.

## Layout

- Use a centered max-width shell (`max-w-7xl`) with 16-32px horizontal padding.
- Landing page rhythm alternates hero, live pipeline proof, and primary challenge CTA.
- Challenge detail uses a two-column brief/evaluator layout on desktop and stacks cleanly on mobile.
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
