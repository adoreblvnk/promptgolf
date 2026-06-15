# Design

## Overview

PromptGolf uses a restrained evaluation-console aesthetic: matte black working surfaces, precise panel borders, compact score artifacts, and small doses of emerald/violet status color. The design should feel like a serious product-quality benchmark with a memorable competitive edge, not generic AI SaaS decoration.

## Color Palette

Use OKLCH tokens and Tailwind arbitrary values where needed.

- Background: `oklch(0.12 0.01 260)` / near-black, used for the page body and app shell.
- Raised surface: `oklch(0.18 0.015 260)` with subtle white alpha borders for panels.
- Inset surface: `oklch(0.145 0.012 260)` for generated-app previews, tables, and nested evidence rows.
- Primary text: `oklch(0.98 0 0)` on dark.
- Secondary text: white alpha 55-70%; never below readable contrast for body copy.
- Muted labels: white alpha 40-50% only for metadata and nonessential labels.
- Accent success: emerald (`oklch(0.82 0.16 155)`) for passing tests, Codex-ready state, and best-run proof.
- Accent warning: amber (`oklch(0.84 0.14 82)`) for hidden-test teasers and degraded provider telemetry.
- Accent intelligence: violet (`oklch(0.67 0.22 292)`) for ambient brand light only, not text gradients.

## Typography

- Font stack: system sans via Tailwind/shadcn defaults for reliability and product familiarity.
- Product UI uses one family across headings, labels, data, and body.
- Hero headings may be large but should keep tracking no tighter than `-0.04em`.
- Body copy should sit around 16-18px with 1.6 line-height and max widths around 65-75ch.
- Metadata labels use modest tracking and sentence/title case; avoid repeated all-caps section eyebrows.

## Components

- App shell: dark matte canvas with subtle radial ambient color and a fine evaluation-grid texture.
- Navigation: compact pill top bar with clear routes and one primary demo CTA.
- Panels: use one restrained raised-surface vocabulary: 16px radius, 1px translucent border, no decorative blur/glass, no wide drop shadows.
- Score pills: high-contrast numeric score plus hidden-test and prompt-count summary.
- Run cards: comparative evidence cards with public/hidden/UX mini-metrics.
- Prompt runner: large monospaced textarea with one obvious submit action, disabled/loading/error states, and clear copy that it posts to `/api/runs` before navigating to the resolved scorecard.
- Timeline: stage list communicates sandbox/build/evaluation progress; each item includes status detail, not just decoration.
- Generated-app preview: schematic screenshot/evidence panel is acceptable for the hackathon slice and should clearly be labeled as generated checkout preview.

## Layout

- Use a centered max-width shell (`max-w-7xl`) with 16-32px horizontal padding and consistent 16px card radius.
- Landing page rhythm alternates hero, proof, provider posture, and challenge CTA.
- Challenge detail uses a two-column brief/evaluator layout on desktop and stacks cleanly on mobile.
- Scorecard pages prioritize result evidence first, then tests, then sandbox timeline.
- Tables and rankings should remain readable on mobile by stacking cells instead of horizontal overflow when practical.

## Motion

- Motion is limited to stateful hover/active feedback and small arrow translations.
- Durations should stay around 150-250ms for product surfaces, with occasional 300-500ms easing on hero CTAs only.
- Include reduced-motion handling globally: disable nonessential transitions and smooth scrolling when users prefer reduced motion.

## Accessibility

- Maintain visible focus outlines through shadcn/Tailwind ring tokens.
- All prompt and form controls need accessible names.
- Avoid using color alone for pass/fail; pair status color with icons/text.
- Ensure touch targets are at least 44px for primary navigation and submission controls.
