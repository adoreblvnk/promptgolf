# PromptGolf Project Context

Last updated: 2026-07-18, for the OpenAI + Daytona + Doubleword production evaluation architecture.

This document is the source of truth for building PromptGolf.

## Product Positioning

PromptGolf is a competitive benchmark for agentic prompting: fewer prompts, more passing tests.

One-liner: PromptGolf is LeetCode for agentic prompting.

Hook: “Everyone loves to benchmark models, but after seeing your prompts, I really ought to benchmark y’all instead.”

Core thesis: Prompting structure can be taught, but hidden tests reveal whether the player has real engineering and domain knowledge.

Do not frame PromptGolf as generic prompt education or a prompt-engineering course. Frame it as evaluation infrastructure for agentic software development: a way to test whether human-written specs cause AI agents to build software that survives production-style checks.

Keep event-specific logistics out of product copy. The README may link to the current Luma page, but the app should read as a durable product, not a one-off hackathon page.

Say:

- PromptGolf benchmarks agentic prompting, not prompt aesthetics.
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
- The live builder is an OpenAI AI SDK v6 tool loop over Daytona: write files, run approved install/build/typecheck/test commands, inspect diagnostics, repair, start the app, verify health, and verify preview.
- Evaluation is positive capability evidence only. The pillars are behavior testing (examples, state-machine traces, fuzz/properties), spec completeness (requirement trees), and artifact adapters (semantic framework discovery into a canonical protocol).
- Evaluator policy rejects negative testing, mutation testing, implementation/signature/CSS fingerprints, and preferred-method enforcement. Contestant artifacts are graded by observable outcomes.
- Live mode fails honestly when required provider steps are unavailable. Local artifact substitution is allowed only in explicit CI stub mode.
- `POST /api/runs` remains available for deterministic naive/structured/expert seeded reference runs.
- Seeded run pages, the leaderboard, scorecards, provider posture, generated-checkout preview surfaces, and API routes should remain functional under `npm run build`.
- Provider integrations use OpenAI, Daytona, and Doubleword adapters where keys are present and report unavailable/degraded state when services cannot be reached.

Do not print or commit real secrets. `.env` contains provider keys.

Verified command history for the current slice: `npm run lint`, `npm run build`, `CI=1 npm run test:e2e`.

Routine agent verification should prefer `npm run lint` and `npm run build`. Do not run `npm run test:e2e` unless the user explicitly asks in that session.

## Routes

User-facing routes:

- `/` - landing page.
- `/challenges` - challenge catalog.
- `/challenges/[slug]` - challenge detail, public brief, prompt guide, and prompt submission.
- `/live-runs/[id]` - live generated checkout run with SSE timeline, same-origin preview proxy, Playwright results, OpenAI visual judgment, and post-score Doubleword diagnosis.
- `/runs/[id]` - seeded/reference scorecard run page.
- `/leaderboard` - seeded leaderboard.

API routes:

- `/api/challenges` - challenge listing/data.
- `/api/runs` - deterministic seeded-run classification for naive/structured/expert prompts.
- `/api/score` - score computation endpoint.
- `/api/generate-tests` - compatibility endpoint that reports stored validated EvalSpec titles; contestant runs do not regenerate tests.
- `/api/live-runs` - create a live provider-backed run.
- `/api/live-runs/[id]` - poll live run state without exposing prompt or generated HTML.
- `/api/live-runs/[id]/events` - stream live run timeline events over SSE.
- `/api/live-runs/[id]/artifact` - serve the deterministic generated HTML artifact only for CI stub mode.
- `/api/live-runs/[id]/preview` - same-origin proxy for Daytona/local preview URLs with allowed-host checks.

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

Live provider paths:

- Use `@ai-sdk/openai` with `OPENAI_API_KEY` for the live builder and visual judge.
- Use `@doubleword/vercel-ai` with `DOUBLEWORD_API_KEY` for post-score prompt diagnosis.
- Builder model: `gpt-5.4-mini`, reasoning `medium`, verbosity `low`.
- Visual judge model: `gpt-5.4-mini`, reasoning `low`.
- Prompt diagnosis model: async `DOUBLEWORD_MODEL`, default `Qwen/Qwen3-VL-30B-A3B-Instruct-FP8`.
- Offline EvalSpec authoring/review only: `gpt-5.5`.
- Behavior grading uses Playwright only, no model.
- Do not use Moonshot, Agnes, TokenRouter, Google, Codex, handwritten provider HTTP calls, model routing, or live fallback providers.

Configured provider details:

- Daytona SDK is used behind the sandbox adapter for live workspace execution and preview infrastructure.
- Daytona uses `DAYTONA_API_KEY` independently as sandbox infrastructure.
- Doubleword uses its official Vercel AI SDK provider and `DOUBLEWORD_API_KEY`; diagnosis is advisory and never changes the locked score.
- Stored validated EvalSpecs are checked in and reused during contestant runs.

## Live Run Pipeline

Current live execution steps:

1. Create an in-memory live run.
2. Create a Daytona sandbox and expose only bounded workspace tools to the OpenAI builder.
3. Run the builder loop: write → build → inspect → fix → start → verify.
4. Require successful production build, `PORT` support, HTTP 200 health route, and runnable preview before finalization.
5. Adapt executable declarations to canonical capabilities without source fingerprints.
6. Store the signed Daytona preview target server-side and expose only the same-origin preview proxy to clients.
7. Use stored validated EvalSpecs; do not regenerate evaluator specs during contestant runs.
8. After preview readiness, run Playwright behavior checks and OpenAI visual judging concurrently.
9. Compute scores deterministically from behavior and visual verdicts.
10. Run Doubleword prompt diagnosis after scoring; diagnosis never alters the score.
11. Stream timeline events over SSE and store safe run state for polling.

Failure policy:

- Missing `OPENAI_API_KEY` fails live generation.
- Missing `DAYTONA_API_KEY` fails live sandbox execution.
- Missing `DOUBLEWORD_API_KEY` degrades post-score diagnosis without changing the deterministic score.
- Builder step-limit exhaustion, build failure, start failure, health failure, and preview failure are recorded honestly.
- Sandbox failures fail the live run unless `PROMPTGOLF_TEST_PROVIDER_STUBS=1` is set for CI.
- Provider failures should be shown as unavailable/degraded, not simulated success.

## Sandbox Presentation

In the UI, show sandboxing as core infrastructure:

- “Sandbox created.”
- “OpenAI builder wrote workspace files.”
- “Preview server started.”
- “Playwright evaluator attached.”
- “Sandbox auto-stop/archive/delete policy set.”

If sandbox creation fails or is disabled, label the run disabled/degraded rather than successful.

## Model Provider Presentation

Use OpenAI for:

- Daytona tool-calling builder loop.
- Screenshot visual judging after preview readiness.

Use Doubleword for:

- Structured post-score prompt diagnosis.
- Prompting-versus-domain skill feedback that never changes behavior or style scores.

Show provider and model usage on run pages.

UI copy examples:

- “Builder: OpenAI gpt-5.4-mini · Daytona tool loop.”
- “Behavior: stored EvalSpecs materialized by Playwright.”
- “Diagnosis: Doubleword after score lock.”

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

## Positive Evidence Philosophy

Hidden evaluation should reveal whether the prompt includes engineering details competent developers know but novices omit, using only positive observable capability claims.

Good hidden tests:

- Realistic edge cases.
- Domain-specific product rules.
- Failure states.
- Accessibility and UX basics.
- Security and permissions where relevant.
- Idempotency and concurrency issues.
- Data normalization.
- Boundary values.

Prohibited evaluator strategies:

- Testing what an artifact is not or mutating it to manufacture failures.
- Source signatures, implementation hardcoding, CSS-selector fingerprints, or preferred-method enforcement.
- Arbitrary trivia, secret unrelated requirements, or model-specific phrasing checks.

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
- `@ai-sdk/openai`: ^3.0.71.
- `@doubleword/vercel-ai`: ^0.3.1.
- Daytona SDK `@daytona/sdk`: 0.199.0.
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
2. Explain: “PromptGolf benchmarks agentic prompting: fewer prompts, more passing tests.”
3. Show the full-stack ecommerce checkout public brief.
4. Submit or show a naive prompt score: visible app, hidden failures.
5. Show the PromptGolf spec guide.
6. Submit or show an expert prompt score: hidden tests pass because the spec includes ecommerce edge cases.
7. Show the leaderboard.
8. Point to infrastructure: OpenAI drives the Daytona coding loop and visual judge, Daytona sandboxes, Playwright executes the positive behavior checks, and Doubleword diagnoses prompt skill after score lock.
9. Close: “In the AI-agent era, the scarce skill is not typing code. It is writing specs that survive reality.”

## Product Success Criteria

The product is successful if:

- The landing page explains PromptGolf in under 10 seconds.
- The provocative opening line lands without making the product seem unserious.
- The ecommerce checkout challenge is understandable.
- The prompt/spec guide makes the educational wedge obvious.
- The demo shows naive vs structured/expert prompts producing different hidden-test scores.
- The scorecard is visually polished.
- Daytona, OpenAI, Doubleword, stored EvalSpecs, and Playwright are represented through credible adapter-backed flows.
- The product looks like a full working product, not a notebook or toy dashboard.

Final narrative: PromptGolf is not about memorizing prompt tricks. It is about learning how to specify software to AI agents like a real engineer: with context, constraints, edge cases, validation, and domain knowledge.
