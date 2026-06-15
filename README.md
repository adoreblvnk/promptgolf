# PromptGolf

PromptGolf is a competitive benchmark for AI-spec writing: fewer prompts, more passing tests.

The current demo is being prepared for [Agnes AI Hackathon @ SMU](https://luma.com/s9s8bjla). The core flow shows how a vague prompt can pass visible requirements while failing hidden production-style checks, and how a stronger domain-aware spec survives those checks.

## Demo flow

1. Open the landing page.
2. Start the Full Stack Ecommerce Checkout Web App challenge.
3. Read the public brief and hidden-test teaser.
4. Submit a prompt from the challenge page; the app starts a live run and redirects to `/live-runs/[id]`.
5. Inspect the generated checkout preview, hidden-test replay, streaming log, sandbox posture, and TokenRouter/Agnes provider state.
6. Compare the seeded naive, structured, and expert reference runs on the leaderboard.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- AI SDK v6
- `ai-sdk-provider-codex-cli` as the default model boundary
- Playwright for deterministic demo-flow verification

## Provider policy

- Codex CLI provider is the default because the ChatGPT/Codex subscription is unlimited and separate from limited OpenAI provider credits.
- Codex does not support AI SDK tool calls, so current generation/evaluation boundaries do not depend on Codex tool calls.
- OpenAI is only a fallback path or future tool-call path.
- The sandbox runner, TokenRouter, and Agnes AI are behind live adapters. When keys exist, the app performs credentialed probes/model calls and reports connected or degraded state.
- Agnes 2.0 Flash is the primary model path for checkout artifact generation and prompt feedback. TokenRouter uses `https://api.tokenrouter.com/v1` through an OpenAI-compatible adapter.
- Tests use stubbed provider boundaries so CI never needs or exposes real secrets.

## Local commands

```bash
npm run dev
npm run lint
npm run build
npm run test:e2e
```

The verified production server can be started with:

```bash
npm run build
npm run start
```

Then open <http://127.0.0.1:3000>.

## Key routes

- `/` — landing page
- `/challenges` — challenge catalog
- `/challenges/mini-checkout-promo-engine` — primary demo challenge
- `/live-runs/[id]` — live generated app run and Playwright replay
- `/runs/expert-checkout` — expert reference run scorecard
- `/leaderboard` — ranked seeded runs
- `/api/challenges`, `/api/runs`, `/api/runs/[id]`, `/api/score`, `/api/generate-tests` — local product APIs with live provider boundaries where configured

## Functional local loop

The submission path is intentionally real and provider-aware:

1. The challenge form validates the prompt and starts a live run.
2. Agnes 2.0 Flash generates a self-contained checkout artifact from the submitted spec.
3. The sandbox serves the preview when available; otherwise the app reports the fallback state honestly.
4. TokenRouter drafts evaluator posture when configured.
5. Playwright scores the generated app and streams the evidence to `/live-runs/[id]`.
6. Seeded naive, structured, and expert scorecards remain available as stable reference runs.
