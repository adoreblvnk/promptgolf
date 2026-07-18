# AGENTS.md

Use `PROJECT_CONTEXT.md` as the source of truth for PromptGolf. This file summarizes the working rules agents must preserve while implementing.

PromptGolf is a competitive benchmark for agentic prompting: fewer prompts, more passing tests. Build it as a polished full product, not as a rough MVP.

## Core product framing

- One-liner: LeetCode for agentic prompting.
- Hook: “Everyone loves to benchmark models, but after seeing your prompts, I really ought to benchmark y’all instead.”
- Do not frame it as generic prompt education; frame it as evaluation infrastructure for agentic software development.
- The core insight: prompt structure is teachable, but hidden tests reveal real technical/domain knowledge.

## Tech stack

- Next.js App Router, current target Next.js 16.x.
- React 19.x.
- TypeScript.
- Tailwind CSS v4.
- shadcn/ui.
- AI SDK v6.
- `@ai-sdk/openai` for the live builder and visual judge using `OPENAI_API_KEY`.
- `@doubleword/vercel-ai` for post-score prompt diagnosis using `DOUBLEWORD_API_KEY`.
- Daytona for live sandbox/build/start/preview execution using `DAYTONA_API_KEY`.
- Playwright for deterministic behavior evaluation.

## Model/provider policy

- Builder: OpenAI `gpt-5.4-mini`, reasoning `medium`, verbosity `low`.
- Visual judge: OpenAI `gpt-5.4-mini`, reasoning `low`.
- Prompt diagnosis: Doubleword async `DOUBLEWORD_MODEL`, default `Qwen/Qwen3-VL-30B-A3B-Instruct-FP8`.
- Offline EvalSpec authoring/review only: `gpt-5.5`.
- Behavior grading: Playwright only, no model.
- Do not use Moonshot, Agnes, TokenRouter, Google, Codex, handwritten provider HTTP calls, model routing, or live fallback providers.

Environment/API key notes:

- `.env` already has some keys. Never commit or print real API keys.
- Daytona API base URL is handled by the Daytona SDK.
- Keep OpenAI, Daytona, and Doubleword integrations behind adapters. When keys are absent, report unavailable/degraded state honestly rather than simulating provider success.

## Primary challenge

Use Full Stack Ecommerce Checkout Web App as the main demo challenge.

Visible task: build a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

Hidden tests should check ecommerce/product engineering quirks: cents math, promo normalization, invalid codes, discount floor, shipping threshold order, out-of-stock handling, double-submit prevention, quantity boundaries, loading/error states, and mobile usability.

## Product pages to prioritize

- `/` landing page.
- `/challenges` challenge catalog.
- `/challenges/[slug]` public brief + prompt guide + prompt submission.
- `/runs/[id]` run timeline + screenshot + scorecard.
- `/leaderboard` rankings.

## Demo requirements

Show naive vs structured/expert prompts:

- Naive prompt passes visible basics but fails hidden tests.
- Structured prompt passes more.
- Expert prompt passes most/all because it encodes domain quirks.

Scoring should reward public tests, hidden tests, UX/style, and fewer prompts. Do not penalize runtime.

## Current implemented slice

- Prompt submission must remain a real local flow: challenge form/server action → live run creation → `/live-runs/[id]` timeline and scorecard.
- The live builder runs a bounded Daytona coding-agent loop: write → build → inspect → fix → start → verify.
- After builder finalization or step-limit exhaustion, do not switch models, patch the artifact, or substitute fixtures in live mode. Record honest failure.
- Stored validated EvalSpecs are used during contestant runs; they are not regenerated live.
- Playwright behavior checks and OpenAI visual judging run after preview readiness, then Doubleword prompt diagnosis runs after scoring and never changes the score.
- `POST /api/runs` remains available for deterministic naive/structured/expert seeded reference runs.
- Seeded run pages, the leaderboard, scorecards, provider posture, generated-checkout preview surfaces, and API routes should remain functional under `npm run build`.

## Provider posture

Use:

- OpenAI through `@ai-sdk/openai` for the live builder and visual judge.
- Daytona for isolated workspace file writes, approved commands, production build/start, health checks, preview URL, and sandbox lifecycle cleanup.
- Doubleword through `@doubleword/vercel-ai` for structured post-score prompt diagnosis.
- Stored EvalSpecs plus Playwright for deterministic behavior grading.

Do not add unrelated provider integrations unless the scope changes.

## Quality bar

- Beautiful, polished UI matters.
- Prefer deterministic seeded demo data over fragile live integrations for reference scorecards, but never fake live provider success.
- Screenshots + scorecards are enough for MVP evidence; raw logs/traces are optional later.
- Preserve the central narrative: good specs pass hidden tests; vague prompts fail reality.

## Verification policy

- Agents should not run `npm run test:e2e` unless the user explicitly asks for it in that session.
- Prefer `npm test`, `npm run lint`, and `npm run build` for routine agent verification.
- Playwright remains the deterministic evaluator for PromptGolf, but full e2e runs are user-controlled because they can start servers, collide with local ports, and take longer than routine checks.

## Skill usage note

- `impeccable` is an OpenCode slash-command/skill invocation, not a shell command.
- Do not run `$impeccable ...` in bash.
- When suggesting usage, phrase it as OpenCode commands the user types in chat, e.g. `/impeccable craft landing page`.
