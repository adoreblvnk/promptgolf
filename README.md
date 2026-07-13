<div align="center">
  <h1>PromptGolf</h1>
  <p>
    LeetCode for agentic prompting: fewer prompts, more passing tests.
  </p>
  <p>
    Built with Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, AI SDK, Moonshot AI, Daytona, Codex CLI, and Playwright.
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

PromptGolf tests prompting and domain skill by executing specs against real software tasks. An agent creates a framework-native multi-file workspace, then a sandbox builds and runs it. Evaluation records positive capability evidence through three pillars: behavior testing, spec completeness, and artifact adapter testing. It grades outcomes, never resemblance to a preferred implementation.

The current demo is built for [Agnes AI Hackathon @ SMU](https://luma.com/s9s8bjla). It shows how a vague prompt can pass visible requirements while failing hidden ecommerce checks, and how a stronger domain-aware spec survives those checks.

The main challenge is a full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

## Demo

1. Open the landing page.
2. Start the Full Stack Ecommerce Checkout Web App challenge.
3. Read the public brief and hidden-test teaser.
4. Submit a prompt from the challenge page; the app starts a live run and redirects to `/live-runs/[id]`.
5. Inspect the generated checkout preview, hidden-test replay, streaming log, sandbox posture, and Moonshot provider state.
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
- `MOONSHOT_API_KEY` for live model calls and `DAYTONA_API_KEY` for sandbox execution

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
2. The builder creates a validated framework workspace with manifests, files, and build/start metadata.
3. The sandbox uploads, builds, and starts that project; unavailable providers remain honestly degraded.
4. The workspace adapter maps executable declarations, while Playwright observes semantic controls and behavior in the running artifact.
5. Validated EvalSpecs collect positive behavior and requirement evidence; prohibited negative, mutation, fingerprint, and preferred-method strategies are rejected by policy.
6. Seeded naive, structured, and expert scorecards remain available as stable reference runs.

## Provider Policy

- Codex CLI provider is the default because the ChatGPT/Codex subscription is unlimited and separate from limited OpenAI provider credits.
- Codex does not support AI SDK tool calls, so current generation/evaluation boundaries do not depend on Codex tool calls.
- Moonshot AI is the sole live model provider for workspace generation, evaluator drafts, screenshot judgment, and prompt diagnosis.
- Moonshot uses `https://api.moonshot.ai/v1` with `kimi-k2.7-code-highspeed` for workspace generation and `kimi-k2.6` for multimodal evaluation.
- Daytona remains the isolated workspace build/start/preview sandbox.
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
