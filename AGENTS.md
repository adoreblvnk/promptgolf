# AGENTS.md

Use `PROJECT_CONTEXT.md` as the source of truth for PromptGolf. This file summarizes the working rules agents must preserve while implementing.

PromptGolf is a competitive benchmark for AI-spec writing: fewer prompts, more passing tests. Build it as a polished full product, not as a rough MVP.

## Core product framing

- One-liner: LeetCode for AI-era software specs.
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
- Codex CLI provider for main model usage because the ChatGPT subscription is unlimited there.
- Moonshot/Kimi or OpenAI for AI SDK tool-calling flows; prefer Moonshot/Kimi for demo-visible paths and OpenAI as fallback/specific-fit provider.
- Do not use the Google AI SDK provider.
- TokenRouter as model gateway where possible.
- Daytona as sandbox/run infrastructure where possible.
- Playwright for deterministic app evaluation.

## Model/provider policy

Use the AI SDK Codex CLI community provider for default generation flows: https://ai-sdk.dev/providers/community-providers/codex-cli

Codex provider notes:

- Unlimited usage is available through the user's ChatGPT subscription.
- Codex does **not** support AI SDK tool calls. Use it for builder-agent generation via CLI/process boundaries, not `generateText`/`streamText` tool-calling flows.
- Strict Codex model IDs: `gpt-5.5`, `gpt-5.3-codex`, `gpt-5.2-codex`, `gpt-5.2-codex-max`, `gpt-5.2-codex-mini`, `gpt-5.1`, `gpt-5.2`.
- Default to `gpt-5.5` unless implementation constraints suggest a Codex-specific model.

Tool-calling provider notes:

- OpenAI credits exist but are limited. Use sparingly.
- Use Moonshot/Kimi or OpenAI for AI SDK tool-calling flows. Prefer Moonshot/Kimi when it fits because `MOONSHOT_API_KEY` is present; use OpenAI as the reliable fallback or when it fits a specific tool-call path better.
- Do not invent model names. Use only models from the user's provided `OpenAIChatModelId` allowlist. Practical fallback picks: `gpt-5.4-mini`, `gpt-5-mini`, `gpt-4.1-mini`, `o4-mini`, or `gpt-4o-mini`.

Environment/API key notes:

- `.env` already has some keys. Never commit or print real API keys.
- Daytona API base URL: `https://app.daytona.io/api`.
- TokenRouter API base URL: `https://api.tokenrouter.com/v1`.
- Keep Daytona/TokenRouter/Moonshot integrations behind adapters. When keys are absent, report unavailable/degraded state honestly rather than simulating provider success.

## Primary challenge

Use Mini Checkout + Promo Code Engine as the main demo challenge.

Visible task: build a checkout page with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

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

- Prompt submission must remain a real local flow: challenge form/server action → `POST /api/runs`-equivalent classification → run scorecard redirect.
- Deterministic classification into naive, structured, and expert runs remains acceptable for the local product seed scorecards; provider status must come from live adapters or explicit unavailable/degraded states.
- Keep run pages, leaderboard, scorecards, and API routes functional under `npm run build` and Playwright.

## Provider posture

Use:

- Daytona: isolated run/build/test sandbox using `DAYTONA_API_KEY`; if sandbox creation is not enabled, show a real credentialed connectivity/status probe plus an honest disabled/degraded state.
- TokenRouter: model gateway for hidden-test generation, prompt feedback, tool-calling model paths, and model usage display using `TOKENROUTER_API_KEY`.
- Kimi/Moonshot: model backend/test generator and primary tool-calling provider candidate using `MOONSHOT_API_KEY`.

Do not add unrelated provider integrations unless the scope changes.

## Quality bar

- Beautiful, polished UI matters.
- Prefer deterministic seeded demo data over fragile live integrations if time is short.
- Screenshots + scorecards are enough for MVP evidence; raw logs/traces are optional later.
- Preserve the central narrative: good specs pass hidden tests; vague prompts fail reality.

## Verification policy

- Agents should not run `npm run test:e2e` unless the user explicitly asks for it in that session.
- Prefer `npm run lint` and `npm run build` for routine agent verification.
- Playwright remains the deterministic evaluator for PromptGolf, but full e2e runs are user-controlled because they can start servers, collide with local ports, and take longer than routine checks.

## Skill usage note

- `impeccable` is an OpenCode slash-command/skill invocation, not a shell command.
- Do not run `$impeccable ...` in bash.
- When suggesting usage, phrase it as OpenCode commands the user types in chat, e.g. `/impeccable craft landing page`.
