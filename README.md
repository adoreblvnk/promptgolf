# PromptGolf

PromptGolf is a competitive benchmark for AI-spec writing: fewer prompts, more passing tests.

It is built as a polished Agent Forge Singapore hackathon demo. The core flow shows how a vague prompt can pass visible requirements while failing hidden production-style checks, and how a stronger domain-aware spec survives those checks.

## Demo flow

1. Open the landing page.
2. Start the Mini Checkout + Promo Code Engine challenge.
3. Read the public brief, hidden-test teaser, and prompt guide.
4. Submit a prompt through `POST /api/runs`; the local adapter classifies it as naive, structured, or expert and resolves the corresponding run.
5. Inspect the resolved scorecard, generated checkout preview, hidden-test results, Daytona sandbox/run timeline, and TokenRouter/Codex provider posture.
6. Compare naive, structured, and expert runs on the leaderboard.

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
- Daytona, TokenRouter, and Moonshot/Kimi are behind live adapters. When keys exist, the app performs credentialed probes/model calls and reports connected or degraded state.
- Kimi/Moonshot is the sponsor-visible primary model path for prompt feedback/test-generation. TokenRouter uses `https://api.tokenrouter.com/v1` through an OpenAI-compatible adapter.
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
- `/runs/expert-checkout` — expert run scorecard
- `/leaderboard` — ranked seeded runs
- `/api/challenges`, `/api/runs`, `/api/runs/[id]`, `/api/score`, `/api/generate-tests` — local product APIs with live provider boundaries where configured

## Functional local loop

The submission path is intentionally real and provider-aware:

1. The challenge page posts `{ prompt, challengeSlug }` to `/api/runs`.
2. The API validates the prompt, classifies it from prompt content, probes Daytona, and requests Moonshot/TokenRouter feedback when credentials are configured.
3. The route returns the matching product seed run (`naive-checkout`, `structured-checkout`, or `expert-checkout`) plus real provider state.
4. The browser navigates to `/runs/:id`, where the scorecard, tests, provider posture, sandbox/run stages, and leaderboard evidence are rendered.
