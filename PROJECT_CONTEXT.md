# PromptGolf Project Context

Last updated: 2026-06-15, after removing stale planning notes and aligning this document with the current `src/` implementation.

This document is the source of truth for building PromptGolf. Current event link: Agnes AI Hackathon @ SMU, https://luma.com/s9s8bjla.

## Product Positioning

PromptGolf is a competitive benchmark for AI-spec writing: fewer prompts, more passing tests.

One-liner: PromptGolf is LeetCode for AI-era software specs.

Hook: “Everyone loves to benchmark models, but after seeing your prompts, I really ought to benchmark y’all instead.”

Core thesis: Prompting structure can be taught, but hidden tests reveal whether the player has real engineering and domain knowledge.

Do not frame PromptGolf as generic prompt education or a prompt-engineering course. Frame it as evaluation infrastructure for agentic software development: a way to test whether human-written specs cause AI agents to build software that survives production-style checks.

Keep event-specific logistics out of product copy. The README may link to the current Luma page, but the app should read as a durable product, not a one-off hackathon page.

Say:

- PromptGolf benchmarks AI-spec writing, not prompt aesthetics.
- Hidden tests reward requirements thinking, constraints, edge cases, accessibility, failure states, and domain knowledge.
- A structured spec format improves coverage, but domain knowledge wins.
- The winner is not the person who writes the longest prompt; the winner says exactly enough for the agent-built app to pass hidden tests.

Avoid saying:

- “This is a prompt engineering course.”
- “This teaches magic words.”
- “Good prompts always pass.”
- “The template guarantees success.”

## Current Implementation

The current product slice is a real local flow with provider-backed boundaries.

- The app uses the Next.js App Router under `src/app`, reusable UI under `src/components`, and PromptGolf domain code under `src/lib/promptgolf`.
- The challenge page submits prompts through a server action that starts a live run and redirects to `/live-runs/[id]`.
- The live run path uses Agnes 2.0 Flash generation, Daytona sandbox preview creation when credentials are present, TokenRouter evaluator draft generation, Playwright scoring against the generated artifact, and Agnes screenshot/prompt diagnosis.
- Live mode fails honestly when required provider steps are unavailable. Local artifact fallback is only allowed in CI stub mode or when `PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK=1` is explicitly set.
- `POST /api/runs` remains available for deterministic naive/structured/expert seeded reference runs.
- Seeded run pages, the leaderboard, scorecards, provider posture, generated-checkout preview surfaces, and API routes should remain functional under `npm run build`.
- Provider integrations use live adapters where keys are present and report unavailable/degraded state when services cannot be reached.

Do not print or commit real secrets. `.env` contains provider keys.

Verified command history for the current slice: `npm run lint`, `npm run build`, `CI=1 npm run test:e2e`.

Routine agent verification should prefer `npm run lint` and `npm run build`. Do not run `npm run test:e2e` unless the user explicitly asks in that session.

## Routes

User-facing routes:

- `/` — landing page.
- `/challenges` — challenge catalog.
- `/challenges/[slug]` — challenge detail, public brief, prompt guide, and prompt submission.
- `/live-runs/[id]` — live generated checkout run with SSE timeline, same-origin preview proxy, Playwright results, and Agnes diagnosis.
- `/runs/[id]` — seeded/reference scorecard run page.
- `/leaderboard` — seeded leaderboard.

API routes:

- `/api/challenges` — challenge listing/data.
- `/api/runs` — deterministic seeded-run classification for naive/structured/expert prompts.
- `/api/score` — score computation endpoint.
- `/api/generate-tests` — TokenRouter-first evaluator draft endpoint with Agnes fallback.
- `/api/live-runs` — create a live provider-backed run.
- `/api/live-runs/[id]` — poll live run state without exposing prompt or generated HTML.
- `/api/live-runs/[id]/events` — stream live run timeline events over SSE.
- `/api/live-runs/[id]/artifact` — serve the generated HTML artifact for CI or explicit local fallback.
- `/api/live-runs/[id]/preview` — same-origin proxy for Daytona/local preview URLs with allowed-host checks.

## Primary Demo Challenge

Use Full Stack Ecommerce Checkout Web App as the main demo challenge.

Public brief: Build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

Public requirements:

- Display cart items with name, price, and quantity.
- Allow quantity changes.
- Show subtotal, shipping, tax, discount, and total.
- Accept promo codes.
- Provide a checkout/confirm order button.
- Show a success state after order placement.

Hidden requirements and domain checks:

- Prices should be calculated in integer cents, not floating point dollars.
- Promo codes should be trimmed and case-insensitive.
- Invalid promo codes should show a clear error.
- Discounts must not make totals negative.
- Free shipping uses the intended pre-discount subtotal rule for the current checkout challenge.
- Empty cart must block checkout.
- Out-of-stock items must block checkout.
- Quantity cannot become negative, become zero accidentally, or exceed stock.
- Double-clicking checkout must not create duplicate orders.
- Checkout button should be disabled while submitting.
- Tax should be calculated consistently and rounded intentionally.
- Loading, success, and error states should be visible.
- Keyboard, screen-reader, and mobile affordances should be reasonable for core controls.

Why this challenge works:

- The visible UI is easy to understand.
- Vague prompts pass happy-path checks but miss ecommerce/product engineering details.
- Hidden tests expose cents math, promo normalization, stock rules, async safety, and mobile checkout behavior.

## Secondary Challenge

Team Invites + Role Management exists as a preview challenge.

Public brief: Build a team settings page where an owner can invite users by email, view pending invites, accept invites, and manage member roles.

Hidden requirements to preserve when this becomes live:

- Normalize emails by trimming and lowercasing.
- Prevent duplicate pending invites.
- Resending an invite should not create duplicate records.
- Invite tokens should be single-use.
- Expired or cancelled invites should not be accepted.
- A team cannot remove or demote its last owner.
- Members cannot perform owner-only actions.
- Dangerous actions should require confirmation.
- Avoid open redirect behavior after accepting invites.

## Demo Story

The demo should show three submissions for the ecommerce checkout challenge:

- Naive prompt: mostly repeats the public brief, passes visible basics, fails hidden industry quirks.
- Structured prompt: follows the PromptGolf spec format, passes more tests.
- Expert prompt: includes ecommerce/product edge cases and passes most or all hidden tests.

Seeded reference runs:

- `naive-checkout`: 5/5 public tests, 3/10 hidden tests, UX 6/10, 1 prompt.
- `structured-checkout`: 5/5 public tests, 7/10 hidden tests, UX 8/10, 2 prompts.
- `expert-checkout`: 5/5 public tests, 10/10 hidden tests, UX 9/10, 1 prompt.

The live flow should make clear that provider output is evaluated as generated. Do not silently repair a weak generated artifact into a deterministic success artifact.

## Prompt Format Wedge

PromptGolf is inspired by Joseph’s `.prompt.md` format: https://github.com/adoreblvnk/adoreblvnk/blob/master/templates/.prompt.md

Teach the structure inside the product, but do not grade template compliance directly. The grade is whether the generated app passes tests.

Compact guide structure:

1. Role / operating mode.
2. Goal.
3. Source material / context.
4. Assumptions and domain rules.
5. Immediate task.
6. Scope and edge cases.
7. Validation and quality checks.
8. Output format.

Use copy like: “A one-shot prompt is not a paragraph. It is a compact engineering spec.”

## Provider Policy

Default builder-agent boundary:

- Use the AI SDK Codex CLI community provider for default builder-agent generation flows.
- Default Codex model: `gpt-5.5` unless a Codex-specific model is clearly better.
- Strict Codex model IDs: `gpt-5.5`, `gpt-5.3-codex`, `gpt-5.2-codex`, `gpt-5.2-codex-max`, `gpt-5.2-codex-mini`, `gpt-5.1`, `gpt-5.2`.
- Codex does not support AI SDK tool calls. Do not design Codex flows that require `generateText` or `streamText` tool calls.

Tool-calling and live model paths:

- Use Agnes AI or OpenAI for AI SDK tool-calling flows.
- Prefer Agnes AI for demo-visible paths because `AGNES_AI_API_KEY` is present.
- Use OpenAI sparingly as a reliable fallback or when it fits a specific tool-call path better.
- Do not use the Google AI SDK provider.
- TokenRouter is the model gateway where possible.

Configured provider details:

- Daytona sandbox SDK/API: used behind the sandbox adapter for live preview infrastructure.
- TokenRouter base URL: `https://api.tokenrouter.com/v1`.
- TokenRouter default model in code: `openai/gpt-5.4-mini` unless overridden by `TOKENROUTER_MODEL`.
- Agnes AI base URL: `https://apihub.agnes-ai.com/v1`.
- Agnes default model in code: `agnes-2.0-flash` unless overridden by `AGNES_AI_MODEL`.

OpenAI posture:

- OpenAI credits exist but are limited.
- Practical fallback picks should come from the user-provided allowlist, such as `gpt-5.4-mini`, `gpt-5-mini`, `gpt-4.1-mini`, `o4-mini`, or `gpt-4o-mini`.
- Do not invent model names.

## Live Run Pipeline

Current live execution steps:

1. Create an in-memory live run.
2. Generate a self-contained checkout HTML artifact with Agnes AI.
3. Observe required checkout contract markers without repairing the artifact.
4. Create a Daytona TypeScript sandbox when credentials are present.
5. Upload `index.html`, start `python3 -m http.server`, probe the sandbox-local server, and expose a signed preview URL.
6. Use the local artifact route only in CI stub mode or explicit local fallback mode.
7. Route evaluator draft generation through TokenRouter before deterministic scoring.
8. Materialize natural-language evaluator specs into Playwright checks.
9. Capture desktop/mobile screenshots and ask Agnes AI for UI/UX judgment.
10. Ask Agnes AI for prompt/technical diagnosis.
11. Stream timeline events over SSE and store safe run state for polling.

Failure policy:

- Missing `AGNES_AI_API_KEY` fails live generation.
- TokenRouter evaluator draft unavailability fails the current live demo path.
- Sandbox failures fail the live run unless `PROMPTGOLF_TEST_PROVIDER_STUBS=1` or `PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK=1` is set.
- Provider failures should be shown as unavailable/degraded, not simulated success.

## Sandbox Presentation

In the UI, show sandboxing as core infrastructure:

- “Sandbox created.”
- “Generated artifact uploaded.”
- “Preview server started.”
- “Playwright evaluator attached.”
- “Sandbox auto-stop/archive/delete policy set.”

If sandbox creation fails or is disabled, label the run disabled/degraded rather than successful.

## TokenRouter Presentation

Use TokenRouter for:

- Hidden natural-language spec to evaluator draft generation.
- Model-routed prompt feedback.
- Optional score explanations.
- Model and usage display on run pages.

UI copy examples:

- “Tests generated via TokenRouter-routed model call.”
- “Prompt feedback routed through TokenRouter.”
- “Model: Codex / OpenAI / Agnes via TokenRouter.”

## Scoring

Do not penalize runtime. Time is not the limiting factor in the product narrative.

Seeded reference scoring in `src/lib/promptgolf/scoring.ts` uses weighted percentages:

```txt
finalScore = publicRatio * 35 + hiddenRatio * 40 + uxRatio * 15 + promptEfficiencyRatio * 10
```

Live run scoring in `src/lib/promptgolf/live-runner.ts` currently reports percentage of passed checks across functional, hidden, and UI/UX categories.

Simple demo copy:

```txt
More passing tests. Fewer prompts. Better score.
```

Tie-breakers:

1. More hidden tests passed.
2. Fewer prompts.
3. Higher UX/style score.
4. Lower token cost if available.

Prompt counting rules:

- Each human message submitted to the builder counts as one prompt.
- One long prompt still counts as one prompt.
- Follow-up fix messages count.
- System scaffolding and platform instructions do not count.
- Manual edits should be disallowed or moved to an assisted category.
- Prompt transcripts should be visible on result pages for transparency, with secrets redacted.

## Hidden Test Philosophy

Hidden tests should reveal whether the prompt includes engineering details competent developers know but novices omit.

Good hidden tests:

- Realistic edge cases.
- Domain-specific product rules.
- Failure states.
- Accessibility and UX basics.
- Security and permissions where relevant.
- Idempotency and concurrency issues.
- Data normalization.
- Boundary values.

Bad hidden tests:

- Arbitrary trivia.
- Secret requirements unrelated to the public task.
- Brittle CSS pixel-perfect checks.
- Tests that require reading the organizer’s mind.
- Model-specific prompt phrasing checks.

Hidden tests should feel fair in hindsight: “A good engineer should have thought of that.”

## Current Checkout Evaluator

Public/functional checks currently include:

- Cart, quantities, totals, promo, and confirmation render.
- Invalid promo error.
- Stock and quantity boundaries.
- Out-of-stock handling.
- Double-submit prevention and loading state.

Hidden checks currently include:

- Integer cents math.
- Promo trim/case-insensitive matching.
- Free shipping threshold based on pre-discount subtotal.

Style checks currently include:

- Checkout visual hierarchy and clarity.
- Mobile UI/UX and touch ergonomics.

For demo UI, show grouped results rather than exposing hidden test source code.

## Visual Direction

Use a polished competitive/developer aesthetic.

Preferred style:

- Dark interface.
- High-contrast green/blue/purple accents.
- Code, test, run-status, and leaderboard motifs.
- Dense but readable panels.
- Beautiful scorecards.
- Terminal/sandbox progress visuals.
- Minimal marketing fluff.

Design references to evoke without copying:

- Linear-level polish.
- LeetCode-style challenge clarity.
- Vercel/Stripe-like product polish.
- Datadog/GitHub Actions-like run status cards.

Do not make it look like a generic AI chatbot.

## Tech Stack Snapshot

Current `package.json` highlights:

- Next.js: 16.2.9.
- React: 19.2.4.
- React DOM: 19.2.4.
- TypeScript: ^5.
- Tailwind CSS: ^4.
- `@tailwindcss/postcss`: ^4.
- shadcn package: ^4.11.0.
- AI SDK package `ai`: ^6.0.203.
- `ai-sdk-provider-codex-cli`: ^1.2.2.
- `@ai-sdk/openai`: ^3.0.71.
- Daytona SDK `@daytonaio/sdk`: ^0.187.0.
- Playwright: ^1.60.0.
- Zod: ^4.4.3.
- lucide-react: ^1.18.0.
- motion: ^12.40.0.
- `@base-ui/react`: ^1.5.0.
- class-variance-authority: ^0.7.1.
- clsx: ^2.1.1.
- tailwind-merge: ^3.6.0.
- next-themes: ^0.4.6.
- sonner: ^2.0.7.
- tw-animate-css: ^1.4.0.

Use npm unless the user explicitly switches package managers.

## Security And Anti-Cheat

For future credibility:

- Hidden tests must not be visible to the builder agent.
- The generated app should not be able to read evaluator files before grading.
- Manual edits should be tracked or disallowed.
- Prompt transcript should be preserved.
- Runs should be reproducible.
- External network behavior should be logged or restricted in serious competitions.
- Secrets must never be shown in prompts or run artifacts.

For the current demo, implement only what is needed for the live flow, but never fake provider success.

## Demo Script

1. Open with: “Everyone benchmarks models, but after seeing your prompts, I really ought to benchmark y’all instead.”
2. Explain: “PromptGolf benchmarks AI-spec writing: fewer prompts, more passing tests.”
3. Show the full-stack ecommerce checkout public brief.
4. Submit or show a naive prompt score: visible app, hidden failures.
5. Show the PromptGolf spec guide.
6. Submit or show an expert prompt score: hidden tests pass because the spec includes ecommerce edge cases.
7. Show the leaderboard.
8. Point to infrastructure: Agnes generates, Daytona sandboxes, TokenRouter routes evaluator drafts, Playwright scores, Agnes diagnoses UI/prompt quality.
9. Close: “In the AI-agent era, the scarce skill is not typing code. It is writing specs that survive reality.”

## Product Success Criteria

The product is successful if:

- The landing page explains PromptGolf in under 10 seconds.
- The provocative opening line lands without making the product seem unserious.
- The ecommerce checkout challenge is understandable.
- The prompt/spec guide makes the educational wedge obvious.
- The demo shows naive vs structured/expert prompts producing different hidden-test scores.
- The scorecard is visually polished.
- Sandbox, TokenRouter, and Agnes are represented through credible adapter-backed flows.
- The product looks like a full working product, not a notebook or toy dashboard.

Final narrative: PromptGolf is not about memorizing prompt tricks. It is about learning how to specify software to AI agents like a real engineer: with context, constraints, edge cases, validation, and domain knowledge.
