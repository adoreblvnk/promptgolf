<div align="center">
  <h1>PromptGolf</h1>
  <p>
    LeetCode for AI-era software specs: fewer prompts, more passing tests.
  </p>
  <p>
    Built with Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, AI SDK, Agnes AI, TokenRouter, Codex CLI, and Playwright.
  </p>
</div>

---

<details>
<summary>Table of Contents</summary>

- [About](#about)
- [Demo](#demo)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Execution](#execution)
- [Usage](#usage)
- [Provider Policy](#provider-policy)
- [Key Routes](#key-routes)
- [Roadmap](#roadmap)
- [Changelog](#changelog)
</details>

## About

PromptGolf tests people on prompting skill and technical skill by executing their prompts against real software tasks, starting with full-stack web apps. An AI agent builds the app, then hidden checks, UI review, and scorecards expose whether the prompt actually captured real product behavior. In an era where everyone assumes AI can one-shot everything, PromptGolf proves the real bottleneck is often the person writing the prompt.

The current demo is built for [Agnes AI Hackathon @ SMU](https://luma.com/s9s8bjla). It shows how a vague prompt can pass visible requirements while failing hidden ecommerce checks, and how a stronger domain-aware spec survives those checks.

The main challenge is a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

## Demo

1. Open the landing page.
2. Start the Full Stack Ecommerce Checkout Web App challenge.
3. Read the public brief and hidden-test teaser.
4. Submit a prompt from the challenge page; the app starts a live run and redirects to `/live-runs/[id]`.
5. Inspect the generated checkout preview, hidden-test replay, streaming log, sandbox posture, and TokenRouter/Agnes provider state.
6. Compare the seeded naive, structured, and expert reference runs on the leaderboard.

## Screenshots

<div align="center">
  <img src="poster/challenge.png" alt="PromptGolf challenge page" width="720">
</div>

<div align="center">
  <img src="poster/bad_run.png" alt="PromptGolf vague prompt run with failing hidden checks" width="360">
  <img src="poster/good_run.png" alt="PromptGolf expert prompt run with passing hidden checks" width="360">
</div>

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Optional provider keys for live Agnes AI, TokenRouter, and sandbox flows

### Installation

```bash
npm install
```

### Execution

Start the development server:

```bash
npm run dev
```

Run routine verification:

```bash
npm run lint
npm run build
```

Start the verified production server:

```bash
npm run build
npm run start
```

Then open <http://127.0.0.1:3000>.

## Usage

The submission path is intentionally real and provider-aware:

1. The challenge form validates the prompt and starts a live run.
2. Agnes 2.0 Flash generates a self-contained checkout artifact from the submitted spec.
3. The sandbox serves the preview when available; otherwise the app reports the fallback state honestly.
4. TokenRouter drafts evaluator posture when configured.
5. Playwright scores the generated app and streams the evidence to `/live-runs/[id]`.
6. Seeded naive, structured, and expert scorecards remain available as stable reference runs.

## Provider Policy

- Codex CLI provider is the default because the ChatGPT/Codex subscription is unlimited and separate from limited OpenAI provider credits.
- Codex does not support AI SDK tool calls, so current generation/evaluation boundaries do not depend on Codex tool calls.
- OpenAI is only a fallback path or future tool-call path.
- The sandbox runner, TokenRouter, and Agnes AI are behind live adapters. When keys exist, the app performs credentialed probes/model calls and reports connected or degraded state.
- Agnes 2.0 Flash is the primary model path for checkout artifact generation and prompt feedback. TokenRouter uses `https://api.tokenrouter.com/v1` through an OpenAI-compatible adapter.
- Tests use stubbed provider boundaries so CI never needs or exposes real secrets.

## Key Routes

- `/` - landing page
- `/challenges` - challenge catalog
- `/challenges/mini-checkout-promo-engine` - primary demo challenge
- `/live-runs/[id]` - live generated app run and Playwright replay
- `/runs/expert-checkout` - expert reference run scorecard
- `/leaderboard` - ranked seeded runs
- `/api/challenges`, `/api/runs`, `/api/runs/[id]`, `/api/score`, `/api/generate-tests` - local product APIs with live provider boundaries where configured

## Roadmap

- Expand challenge catalog beyond ecommerce checkout.
- Add stronger generated-app evidence, screenshots, and replay artifacts.
- Improve live sandbox execution and provider observability.
- Add richer prompt feedback and hidden-test explanations.

## Changelog

See [CHANGELOG](CHANGELOG.md) for details.

## License <!-- omit in toc -->

Distributed under the MIT License.

## Credits <!-- omit in toc -->

- Built for [Agnes AI Hackathon @ SMU](https://luma.com/s9s8bjla).

## Acknowledgements <!-- omit in toc -->

Inspired by Best-README-Template and Markdown All in One table-of-contents conventions.
