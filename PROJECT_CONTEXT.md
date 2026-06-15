# PromptGolf Project Context

Last updated: 2026-06-15, after the event context was updated and the live PromptGolf loop was verified.

This document is the source of truth for building PromptGolf. Current event link: Agnes AI Hackathon @ SMU, https://luma.com/s9s8bjla.

## Current implementation status

The current product slice is a real local flow with provider-backed boundaries. Provider integrations use live adapters where the required keys are present and report explicit unavailable/degraded state when a service cannot be reached.

- The challenge page submits prompts through a server action that starts a live run and redirects to `/live-runs/[id]`.
- The live run path uses Agnes 2.0 Flash generation, Daytona preview infrastructure when available, TokenRouter evaluator posture where configured, and Playwright scoring against the generated artifact.
- `POST /api/runs` remains available for deterministic naive/structured/expert seeded reference runs.
- Run pages render scorecards, public/hidden test results, generated-checkout preview, provider posture, and a sandbox/run timeline whose provider state is backed by Daytona/TokenRouter/Agnes adapters.
- The leaderboard ranks seeded runs by computed score.
- `DAYTONA_API_KEY`, `TOKENROUTER_API_KEY`, and `AGNES_AI_API_KEY` are present in `.env`; do not print them. Use real Daytona/TokenRouter/Agnes adapter paths when provider work is requested, with unavailable/degraded states rather than fake provider success.
- Codex CLI via `ai-sdk-provider-codex-cli` remains the default builder-agent boundary; Codex has no AI SDK tool-call support, so AI SDK tool-calling flows should use Agnes AI or OpenAI adapters instead.
- Verified commands: `npm run lint`, `npm run build`, `CI=1 npm run test:e2e`.

## 1. Product summary

PromptGolf is a competitive benchmark for AI-spec writing: fewer prompts, more passing tests.

Developers compete to turn vague product briefs into working applications in the fewest human prompts. Each submission is sent to an AI coding agent, built inside an isolated sandbox, evaluated against public and hidden tests, then scored on correctness, UX, style, and prompt efficiency.

The core belief: everyone benchmarks models, but after seeing how people prompt AI coding agents, PromptGolf benchmarks the humans instead.

## 2. One-line positioning

PromptGolf is LeetCode for AI-era software specs: write the shortest AI prompt/spec that gets an agent-built app to pass hidden production-style tests.

## 3. Short pitch

AI coding agents are powerful, but most failures come from weak specs: missing edge cases, unstated product rules, vague UX expectations, and missing domain knowledge. PromptGolf turns that into a game and evaluation platform. Players see a public challenge brief, submit prompts to an AI coding agent, and score higher when the generated app passes hidden functional, UX, and industry-quirk tests in fewer prompts.

## 4. Provocative opening line

Everyone loves to benchmark models, but after seeing your prompts, I really ought to benchmark y’all instead.

Use this as the live-demo hook, then immediately clarify:

PromptGolf does not judge whether your prompt sounds clever. It judges whether your prompt creates a working product that survives hidden tests.

## 5. Demo constraints

Keep event-specific logistics out of the product copy. The README links to the current Luma page.

Project-relevant constraints to preserve:

- The product must read as a production AI system, not a simple chatbot.
- It should be ready for a short live demo and read as a polished working product.
- Provider usage should fit the core loop; prioritize Daytona and TokenRouter where they materially improve the run/evaluation path.

## 6. Strategic framing

Do not pitch PromptGolf as generic prompt education. Pitch it as a production-grade evaluation loop for agentic software development.

Say:

- PromptGolf benchmarks AI-spec writing, not prompt aesthetics.
- The product trains developers to encode requirements, constraints, edge cases, and domain assumptions into prompts that AI coding agents can execute.
- Hidden tests reveal whether the player actually understands the engineering domain.
- The platform is useful for live AI build events, bootcamps, coding teams adopting AI agents, and companies training engineers to use AI coding tools safely.

Avoid saying:

- “This is a prompt engineering course.”
- “This teaches people magic words.”
- “Good prompts always pass.”
- “The template guarantees success.”

Better claim:

- A structured AI-spec format improves coverage, but domain knowledge wins.
- The hidden tests reward real technical judgment.

## 7. Core thesis

Prompting skill can be taught; industry knowledge cannot be cheaply faked.

A player can learn the project’s prompt structure and improve quickly. But if they do not understand the domain, hidden tests expose that gap.

Analogy: to build a car, most people remember wheels and an engine; a stronger engineer remembers brakes, mirrors, lights, crash safety, dashboard indicators, and the industry quirks of the car type. For a sports car, they may also remember spoiler/wing expectations. PromptGolf’s hidden tests check for those overlooked details.

## 8. The prompt format wedge

PromptGolf is inspired by Joseph’s `.prompt.md` format: https://github.com/adoreblvnk/adoreblvnk/blob/master/templates/.prompt.md

PromptGolf should teach this structure inside the product, but it should not grade template compliance directly. The real grade is whether the generated app passes tests.

## 9. Product promise

PromptGolf lets a user answer three questions:

1. Can I turn a vague brief into a precise AI-buildable spec?
2. Did my AI-generated app actually work beyond the happy path?
3. Did I need fewer prompts than other developers to get there?

## 10. Primary user personas

### AI-native developer

Wants to get better at steering coding agents. Already uses tools like Codex, OpenCode, Cursor, Claude Code, or similar.

### Live-event builder

Wants to learn how to write prompts that generate complete apps fast.

### Engineering team / startup

Wants to train engineers on AI-assisted development and evaluate whether their prompts/specs produce robust software.

### Bootcamp / school instructor

Wants assignments where students learn requirements thinking, hidden edge cases, testing, and agentic coding.

## 11. Product principles

- Benchmark outputs, not vibes.
- Fewer prompts matter, but passing tests matters more.
- Hidden tests should test technical judgment, not trivia.
- The best prompt is a compact software spec with constraints, edge cases, validation, and acceptance criteria.
- Public requirements should be clear enough to start; hidden tests should reveal missing domain assumptions.
- The UI must look polished and complete. This is a product demo, not a bare MVP.
- Demo stability matters more than a fully generalized backend.

## 12. Scope for the current build

Build a polished vertical product slice, not a rough MVP.

The product should feel complete enough for a live audience:

- landing page
- challenge catalog
- challenge detail page
- prompt/spec guide
- prompt submission flow
- run/progress screen
- scorecard/result screen
- leaderboard
- at least two challenge examples
- one strong end-to-end demo showing naive vs structured/expert prompt performance
- provider integration surfaces for Daytona and TokenRouter

The backend can use product seed runs for demo scorecards, but provider execution/status must come from live adapters or explicit unavailable/degraded states.

## 13. Demo story

The demo should show three submissions for the same challenge:

1. Naive prompt: mostly pastes the public task, passes visible basics, fails hidden industry quirks.
2. Structured prompt: follows the PromptGolf spec format, passes more tests.
3. Expert prompt: includes domain knowledge and edge cases, passes the most tests in one prompt.

This proves the thesis quickly.

## 14. Best first challenge: Mini Checkout + Promo Code Engine

Use this as the main demo challenge because it is easier than the gesture-controlled presentation app but still rich in hidden industry quirks.

### Public brief

Build a checkout page with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.

### Why this works

- Easy to understand.
- Easy to build with Next.js and shadcn/ui.
- Easy to test with Playwright.
- Hidden tests expose common ecommerce/product engineering knowledge.
- Pasting the public task into an AI agent will likely miss edge cases.

### Public requirements

- Display cart items with name, price, and quantity.
- Allow quantity changes.
- Show subtotal, shipping, tax, discount, and total.
- Accept promo codes.
- Provide a checkout/confirm order button.
- Show a success state after order placement.

### Hidden requirements / technical knowledge checks

- Prices should be calculated in integer cents, not floating point dollars.
- Promo codes should be trimmed and case-insensitive.
- Invalid promo codes should show a clear error.
- Discounts must not make totals negative.
- Free-shipping threshold must be applied in the intended order, e.g. based on subtotal before or after discount depending on challenge rule.
- Empty cart must block checkout.
- Out-of-stock items must block checkout.
- Quantity cannot become negative, zero unless removal is intentional, or exceed stock.
- Double-clicking checkout must not create duplicate orders.
- Checkout button should be disabled while submitting.
- Tax should be calculated consistently and rounded intentionally.
- Loading, success, and error states should be visible.
- Keyboard and screen-reader affordances should be reasonable for core controls.

### Example score result

Naive prompt:

- Public tests: 5/5.
- Hidden tests: 3/10.
- UX/style: 6/10.
- Prompts: 1.
- Result: visible app works but fails realistic checkout behavior.

Expert prompt:

- Public tests: 5/5.
- Hidden tests: 9/10.
- UX/style: 8/10.
- Prompts: 1.
- Result: one-shot app with strong domain coverage.

## 15. Secondary challenge: Team Invites + Role Management

Use this if a second product-like challenge is needed.

### Public brief

Build a team settings page where an owner can invite users by email, view pending invites, accept invites, and manage member roles.

### Hidden requirements

- Normalize emails by trimming and lowercasing.
- Prevent duplicate pending invites.
- Resending an invite should not create duplicate records.
- Invite tokens should be single-use.
- Expired/cancelled invites should not be accepted.
- A team cannot remove or demote its last owner.
- Members cannot perform owner-only actions.
- Role labels should be clear.
- Dangerous actions should require confirmation.
- Avoid open redirect behavior after accepting invites.

### Why this works

It is a common SaaS workflow. A vague AI prompt will produce UI CRUD, but hidden tests reveal whether the user understands permissions and lifecycle states.

## 16. More possible challenge ideas

### Image Upload Gallery / Avatar Uploader

Public brief: build drag-and-drop upload with preview, remove, and save.

Hidden tests:

- validate MIME type, not just extension
- reject oversized files
- safe duplicate filenames
- preview before upload completes
- remove/cancel pending upload
- handle upload failure/retry
- keyboard-accessible controls
- object URL cleanup

### Command Palette / Global Search

Public brief: add Cmd/Ctrl+K command palette with searchable actions.

Hidden tests:

- Cmd+K and Ctrl+K behavior
- Escape closes and restores focus
- Arrow keys move selection
- Enter activates
- no-results state
- disabled actions cannot run
- stale async results ignored
- ARIA dialog/listbox roles

### Booking Scheduler

Public brief: build booking page where users pick an available time slot and confirm appointment.

Hidden tests:

- timezone display
- no bookings in the past
- lead-time rules
- working hours
- overlapping bookings blocked
- double-submit blocked
- cancellation reopens slot
- clear unavailable/loading states

## 17. Scoring model

Do not include runtime as a scoring penalty. Time is not the limiting factor in this product narrative.

Use:

```txt
score =
  public_tests_passed * 50
  + hidden_tests_passed * 100
  + ux_score * 25
  + style_score * 15
  - prompt_count * 50
  - manual_edit_penalty
```

Simpler demo copy:

```txt
More passing tests. Fewer prompts. Better score.
```

Tie-breakers:

1. More hidden tests passed.
2. Fewer prompts.
3. Higher UX/style score.
4. Lower token cost if available.

## 18. Prompt counting rules

- Each human message submitted to the builder counts as one prompt.
- One long prompt still counts as one prompt.
- Follow-up fix messages count.
- System scaffolding and platform instructions do not count.
- Manual code edits should either be disallowed or moved to an “assisted” category.
- Copying generated code into the app manually should be treated as manual editing unless the platform controls it.
- Prompt transcripts should be visible on result pages for transparency, with secrets redacted.

## 19. Hidden test philosophy

Hidden tests should reveal whether the prompt includes the engineering details that competent developers know but novices omit.

Good hidden tests:

- realistic edge cases
- domain-specific product rules
- failure states
- accessibility and UX basics
- security/permissions where relevant
- idempotency and concurrency issues
- data normalization
- boundary values

Bad hidden tests:

- arbitrary trivia
- secret requirements unrelated to the public task
- brittle CSS pixel-perfect checks
- tests that require reading the organizer’s mind
- model-specific prompt phrasing checks

Hidden tests should feel fair in hindsight: “A good engineer should have thought of that.”

## 20. Test generation model

The platform stores hidden tests initially as natural-language specifications. Default model calls should use the AI SDK Codex CLI provider because the user has unlimited ChatGPT/Codex usage. Agnes AI and OpenAI are secondary paths: Agnes AI's key is present, while OpenAI credits remain limited.

Important: LLMs can generate the test code, but final grading should execute deterministic tests wherever possible.

Pipeline:

1. Challenge author writes public brief.
2. Challenge author writes hidden test specs in natural language.
3. LLM expands specs into Playwright tests.
4. Human or system validates generated test code.
5. Tests are stored as hidden evaluator code.
6. Submissions run against the hidden tests.
7. Scorecard displays test categories and pass/fail counts, not the hidden test source.

For the live demo, it is acceptable to keep product seed Playwright checks for stable scorecards. Any provider-generated tests or feedback should be labeled as live, unavailable, or degraded based on adapter results.

Model/provider policy:

- Default provider: AI SDK Codex CLI community provider (`ai-sdk-provider-codex-cli`) using the user’s unlimited ChatGPT/Codex subscription.
- Codex provider docs: https://ai-sdk.dev/providers/community-providers/codex-cli
- Strict Codex model IDs: `gpt-5.5`, `gpt-5.3-codex`, `gpt-5.2-codex`, `gpt-5.2-codex-max`, `gpt-5.2-codex-mini`, `gpt-5.1`, `gpt-5.2`.
- Default Codex model: `gpt-5.5` unless a Codex-specific model is clearly better for the flow.
- Codex does not support AI SDK tool calls. Do not design Codex flows that require `generateText`/`streamText` tools. Use Codex for builder-agent generation via CLI/process boundaries, deterministic app code, Playwright, and server-side logic outside the model call instead.
- For AI SDK tool-calling flows, use Agnes AI or OpenAI. Prefer Agnes AI when it fits because `AGNES_AI_API_KEY` is present; use OpenAI as the reliable fallback, especially if Agnes behavior/API fit is weaker for a specific tool-call path. Decide per flow rather than hardcoding one global tool-calling provider.
- OpenAI provider exists but credits are limited. Use it sparingly for fallback paths or flows that genuinely need tool-call support.
- Do not use the Google AI SDK provider.
- `DAYTONA_API_KEY`, `TOKENROUTER_API_KEY`, and `AGNES_AI_API_KEY` are present in `.env`; never print or commit their values. Daytona base URL: `https://app.daytona.io/api`. TokenRouter base URL: `https://api.tokenrouter.com/v1`. Agnes AI base URL: `https://apihub.agnes-ai.com/v1`. Keep live integrations behind adapters and surface unavailable/degraded state honestly on failure.

## 21. Provider strategy

### Use: Daytona

Daytona is the core sandbox layer: each PromptGolf run can create an isolated environment where an AI-generated app is built, executed, and tested safely.

### Use: TokenRouter

TokenRouter is the model gateway now that its key is available: route Codex/OpenAI/Agnes-style calls for test generation, prompt feedback, scoring explanations, tool-calling model paths, and provider comparison while tracking model usage and cost.

### Use: Agnes AI

Agnes 2.0 Flash is the primary live checkout artifact generator and can also be used as a tool-calling provider because `AGNES_AI_API_KEY` is present.

## 22. Technical architecture

Recommended architecture:

- Next.js App Router frontend/backend.
- shadcn/ui components for polished UI.
- Tailwind CSS v4 for styling.
- AI SDK v6 for model calls.
- Codex CLI community provider as the default model provider.
- Agnes AI or OpenAI for AI SDK tool-calling flows; prefer Agnes AI for demo-visible paths, use OpenAI as the reliable low-credit fallback or when it is the better fit for a specific tool-call path.
- TokenRouter as model gateway using `TOKENROUTER_API_KEY` and `https://api.tokenrouter.com/v1`, with explicit degraded/unavailable states if routing fails.
- Daytona SDK/API for sandbox lifecycle and command execution using `DAYTONA_API_KEY` and `https://app.daytona.io/api`, with a credentialed status probe when sandbox creation is disabled.
- Playwright for deterministic app evaluation.
- Simple local JSON/SQLite/Postgres storage depending on time.
- Product seed runs for demo reliability, clearly separate from provider execution status.

## 23. Current scaffold/package versions

Package snapshot from current `package.json` after scaffolding:

- Next.js: 16.2.9.
- React: 19.2.4.
- React DOM: 19.2.4.
- AI SDK package `ai`: ^6.0.203.
- Codex CLI provider `ai-sdk-provider-codex-cli`: ^1.2.2.
- `@ai-sdk/openai`: ^3.0.71, fallback/tool-call paths only.
- Zod: ^4.4.3.
- lucide-react: ^1.18.0.
- motion: ^12.40.0.
- clsx: ^2.1.1.
- tailwind-merge: ^3.6.0.
- shadcn package: ^4.11.0.
- Tailwind CSS: ^4.
- `@tailwindcss/postcss`: ^4.
- TypeScript: ^5.

## 24. Recommended package choices

Use npm for reliability unless the user explicitly switches to pnpm/bun.

Core install intent for model packages:

```bash
npm install ai ai-sdk-provider-codex-cli @ai-sdk/openai zod lucide-react motion clsx tailwind-merge
npm install -D @playwright/test playwright
```

Add Daytona when wiring the sandbox adapter; `DAYTONA_API_KEY` is present, so the blocker is implementation time/API fit, not missing credentials.

Use `@ai-sdk/openai` with TokenRouter's OpenAI-compatible `baseURL` (`https://api.tokenrouter.com/v1`) and `TOKENROUTER_API_KEY`; keep this path dependency-injectable for tests, not provider-mocked in production.

## 25. Suggested app routes

Use Next.js App Router.

Routes:

- `/` — landing page.
- `/challenges` — challenge catalog.
- `/challenges/[slug]` — challenge detail, public brief, prompt guide, submit prompt.
- `/runs/[id]` — run progress and scorecard.
- `/leaderboard` — global or challenge-specific leaderboard.
- `/about` — explanation of PromptGolf and AI-spec writing.
- `/api/challenges` — challenge listing/data.
- `/api/runs` — create run.
- `/api/runs/[id]` — get run status/results.
- `/api/generate-tests` — demo endpoint for natural-language hidden spec to Playwright test generation.
- `/api/score` — compute score from test results.

## 26. Data model notes, not implementation schema

Do not treat this section as authoritative TypeScript. Use it as product-level pseudocode only; the actual schema should be written during implementation with the current app structure and libraries.

Core entities to support:

- **Challenge**: slug, title, difficulty, public brief, visible requirements, private hidden-test specs, starter type, scoring weights.
- **Hidden test spec**: title, natural-language behavior to verify, category, weight, visibility rules.
- **Run**: challenge, player/team, submitted prompt, prompt count, selected model/provider, run status, sandbox/app URL, screenshots/artifacts, test results, final score.
- **Test result**: public or hidden, category, pass/fail, failure message, optional evidence screenshot.
- **Scoring weights**: public tests, hidden tests, UX/style score, prompt-count penalty, optional manual-edit penalty.

Keep the implementation flexible: seeded demo data is acceptable first; persistent storage can come after the live flow works.

## 27. Suggested UI pages and components

### Landing page

Purpose: make the audience understand the product in 10 seconds.

Required sections:

- Hero with provocative benchmark line.
- One-line positioning.
- Three-step flow: Prompt → Build in Sandbox → Hidden Tests Score.
- Demo challenge cards.
- Provider integration badges for Daytona and TokenRouter.
- CTA: “Try the Checkout Challenge.”

### Challenge page

Required sections:

- Public brief.
- Public requirements.
- Hidden test teaser, e.g. “Hidden tests check edge cases, product quirks, accessibility, and failure states.”
- PromptGolf spec guide panel based on `.prompt.md`.
- Prompt editor.
- Submit/run button.
- Example “bad prompt vs strong spec” comparison.

### Run page

Required sections:

- Run status timeline: queued, generating, building, testing, scored.
- Prompt count.
- Model/provider used.
- Daytona sandbox badge.
- TokenRouter badge.
- Screenshot of generated app.
- Scorecard.
- Public vs hidden test breakdown.
- UX/style score.
- Final score.

### Leaderboard

Required sections:

- Rank.
- Player/submission name.
- Challenge.
- Prompt count.
- Public tests passed.
- Hidden tests passed.
- UX/style score.
- Total score.
- App screenshot thumbnail.

### Prompt guide panel

Show a compact prompt structure:

1. Role / operating mode.
2. Goal.
3. Source material / context.
4. Assumptions and domain rules.
5. Immediate task.
6. Scope and edge cases.
7. Validation and quality checks.
8. Output format.

Use copy like:

A one-shot prompt is not a paragraph. It is a compact engineering spec.

## 28. Visual design direction

Use a polished competitive/developer aesthetic.

Suggested style:

- Dark interface.
- High-contrast green/blue/purple accents.
- Code/test/leaderboard motif.
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

## 29. Demo data to seed

Seed at least these runs:

### Checkout challenge seeded runs

Naive Prompt — 1 prompt:

- Public tests: 5/5.
- Hidden tests: 3/10.
- UX: 6/10.
- Style: 6/10.
- Score: low-middle.
- Failure summary: misses cents math, duplicate submit, stock validation, promo normalization.

Structured Prompt — 1 prompt:

- Public tests: 5/5.
- Hidden tests: 7/10.
- UX: 8/10.
- Style: 8/10.
- Score: high.
- Failure summary: misses one or two nuanced tax/shipping rules.

Expert Prompt — 1 prompt:

- Public tests: 5/5.
- Hidden tests: 9/10 or 10/10.
- UX: 9/10.
- Style: 9/10.
- Score: top.
- Failure summary: none or minor accessibility note.

Optional bad baseline:

Pasted Brief Prompt — 1 prompt:

- Public tests: 3/5.
- Hidden tests: 1/10.
- UX: 5/10.
- Style: 5/10.

This makes the product thesis obvious.

## 30. How to present Daytona usage

In the UI, show Daytona as core infrastructure:

- “Sandbox created.”
- “Dependencies installed.”
- “Generated app started.”
- “Playwright evaluator attached.”
- “Sandbox destroyed/reset.”

If full Daytona integration is not ready, keep the architecture Daytona-ready with a thin sandbox-runner boundary:

- create a run from a prompt and challenge
- report run status through queued → generating → building → testing → scored/failed
- return artifacts such as app URL, screenshots, logs, and scorecard

If full sandbox creation is disabled, use the Daytona adapter for a credentialed connectivity/status probe and label the creation step disabled/degraded rather than successful.

## 31. How to present TokenRouter usage

Use TokenRouter for:

- hidden natural-language spec to Playwright test generation
- model-routed prompt feedback
- optional score explanations
- model/cost display on run pages

UI copy:

- “Tests generated via TokenRouter-routed model call.”
- “Prompt feedback routed through TokenRouter.”
- “Model: Codex / OpenAI / Agnes via TokenRouter.”

If TokenRouter API is not integrated, keep the boundary conceptual rather than locking in code here:

- input: hidden natural-language specs and run failure details
- output: generated Playwright-style checks, prompt feedback, and short failure explanations
- implementation detail: decide the exact function names/types later when wiring the app

## 32. Test implementation approach

Use Playwright for app behavior.

Minimum public tests for checkout:

- page loads
- cart items visible
- quantity changes update subtotal
- valid promo code updates discount
- checkout shows success state

Minimum hidden tests for checkout:

- case-insensitive promo code
- cents/rounding behavior
- double-click prevention
- empty cart blocks checkout
- out-of-stock blocks checkout
- invalid promo shows error
- quantity boundaries
- free-shipping threshold order
- loading state during checkout
- mobile viewport still usable

For demo UI, show grouped results rather than exposing every hidden test detail.

Example hidden display:

- Ecommerce math: 3/4.
- Checkout reliability: 2/3.
- Edge cases: 2/3.
- UX/accessibility: 2/2.

## 33. Screenshots vs logs/traces

For the current product slice, screenshots and pass/fail summaries are enough for demo comprehension.

Logs and Playwright traces are useful later for debugging, but they are not required for the core 2-minute demo.

Store/display:

- screenshot of generated app
- scorecard
- failure category summaries
- prompt transcript

Optional later:

- raw logs
- Playwright trace viewer
- video replay
- generated app archive

## 34. Security / anti-cheat posture

For future product credibility:

- Hidden tests must not be visible to the builder agent.
- The generated app should not be able to read evaluator files before grading.
- Manual edits should be tracked or disallowed.
- Prompt transcript should be preserved.
- Runs should be reproducible.
- External network behavior should be logged or restricted in serious competitions.
- Secrets must never be shown in prompts or run artifacts.

For the demo:

- Communicate these as design principles.
- Implement only the parts needed for the demo.

## 35. Success criteria

The product is successful if:

- The landing page clearly explains PromptGolf in under 10 seconds.
- The provocative opening line lands without making the product seem unserious.
- The checkout challenge is understandable.
- The prompt/spec guide makes the educational wedge obvious.
- The demo shows naive vs structured/expert prompts producing different hidden-test scores.
- The scorecard is visually polished.
- Daytona and TokenRouter are integrated or represented through credible adapter-backed flows.
- The product looks like a full working product, not a notebook or toy dashboard.

## 36. Suggested implementation order

1. Create polished landing page and design system.
2. Define challenge data and seeded runs.
3. Build challenge detail page with prompt guide.
4. Build run page with status timeline and scorecard.
5. Build leaderboard.
6. Add API routes for challenges/runs/score product seed data and provider-aware status.
7. Add Codex-first model abstraction; keep TokenRouter/OpenAI/Agnes as optional routed paths.
8. Add Daytona sandbox runner abstraction.
9. Add one actual Playwright test file or simulated test-run artifact for credibility.
10. Polish UI and rehearse demo script.

## 37. Demo script outline

1. Open with: “Everyone benchmarks models, but after seeing your prompts, I really ought to benchmark y’all instead.”
2. Explain: “PromptGolf benchmarks AI-spec writing: fewer prompts, more passing tests.”
3. Show checkout challenge public brief.
4. Show naive prompt score: visible app, hidden failures.
5. Show PromptGolf spec guide.
6. Show expert prompt score: hidden tests pass because it includes ecommerce edge cases.
7. Show leaderboard.
8. Point to infrastructure: Daytona sandboxes or probes each run when the live adapter is enabled; Codex handles CLI builder-agent generation; TokenRouter routes model/test-generation calls and reports degraded/unavailable state on failure.
9. Close: “In the AI-agent era, the scarce skill is not typing code. It is writing specs that survive reality.”

## 38. Final product narrative

PromptGolf is not about memorizing prompt tricks. It is about learning how to specify software to AI agents like a real engineer: with context, constraints, edge cases, validation, and domain knowledge.

The winner is not the person who writes the longest prompt. The winner is the person who says exactly enough for the agent-built app to pass hidden tests.
