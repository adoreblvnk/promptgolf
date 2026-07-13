# PromptGolf landing redesign — direction studies and selection

**Prepared:** 2026-07-14 (SGT)
**Inputs:** `research-pass-01.md`, `research-pass-02.md`, current landing/source/assets, PRODUCT.md, DESIGN.md, PROJECT_CONTEXT.md, Impeccable brand + product registers.
**Gate posture:** evidence-only study; no production source edited.

## Landing brief

### Audience and moment

AI-native developers and engineering-minded competitors arrive during a demo, workshop, or practice session. They already believe coding agents can build plausible software. They need to understand—inside two viewports—what PromptGolf measures, why it is hard, and why a high score says something meaningful about the human specification.

### Physical scene and brand voice

A developer opens the benchmark late in a focused build session under low ambient light, looking for a hard, inspectable standard rather than inspiration or a course. This supports the established graphite environment, but the landing needs a single amber evidence instrument with more presence than the calm inner routes.

Voice words: **forensic, competitive, unsentimental**. The page should feel like a scorekeeper that can explain every mark.

### First-two-viewports contract

1. **Thesis:** AI capability is now the common baseline; reliable human judgment remains scarce.
2. **Constant conditions:** same ecommerce challenge, same OpenAI builder posture, same stored evaluator contract and Playwright behavior checks.
3. **Human variable:** naive request → structured spec → domain-expert spec.
4. **Observable result:** all three can look plausible, while hidden-test survival rises from 3/10 → 7/10 → 10/10 in the real seeded references.
5. **Meaning:** structure is teachable; domain knowledge creates separation; evidence—not prompt aesthetics—decides.
6. **Action:** inspect a run or play the checkout challenge.

### Evidence hierarchy

1. Real seeded run state and named ecommerce boundaries.
2. The held-constant rail: task, builder, evaluator.
3. Prompt-state diagnosis and prompt count.
4. Methodology (positive behavior evidence, requirement completeness, artifact adapters).
5. Leaderboard/status only after the standard is understood.

### Copy hierarchy

- Primary line: **Same agent. Same task. Different human.**
- Thesis support: **AI made building abundant. Reliable judgment is still scarce.**
- Product explanation: PromptGolf holds the machine constant and changes the specification; hidden tests reveal whether the built product survives reality.
- Transformation labels: **Naive request / Structured spec / Domain-expert spec**.
- Conclusion: **Structure is teachable. Domain judgment creates separation.**
- CTA: **Play the checkout challenge**; secondary link: **Inspect the expert run**.

Avoid “promptmaxxing,” anti-AI resentment, unsupported top-percent or hiring claims, generic “level up” language, provider plumbing before proof, and repeated meta-guardrails.

## Direction A — The Cut Line

**Rendered study:** `direction-a-cut-line.png`

A terminal-minimalist completion map inspired by Advent of Code’s economy, not its ASCII costume. One severe field presents three rows and ten meaningful marks. The visual idea is the standard itself: everyone reaches the build, but only some specs cross the hidden contract.

- **Narrative:** hard standard → three attempts → survival map → inspect the standard.
- **Visual system:** near-black monochrome, one green completion state, thin rules, compact mono telemetry, almost no image atmosphere.
- **Motion:** rows fill once or update on explicit keyboard selection. No pinned scroll; static map is complete without JavaScript.
- **Strength:** exceptionally fast, legible, and evidence-dense.
- **Failure mode:** still reads as developer-terminal category shorthand; the human variable is implied more than dramatized. It risks becoming “clean online judge” rather than a distinctive landing idea.

## Direction B — The Human-Spec Gap

**Rendered study:** `direction-b-human-spec-gap.png`

A benchmark instrument informed by METR’s human-readable measurement clarity. It keeps the real ecommerce challenge and constant conditions fixed while a three-state selector updates one persistent evidence surface. Amber is not decoration: it is the trace of specification quality across visible UI, production boundaries, and domain traps.

- **Narrative:** scarce judgment thesis → constant rail → one instrument → three human states → named checks → challenge entry.
- **Visual system:** existing graphite shell with a committed amber measurement layer, restrained green/red semantic states, Inter/mono continuity, square-edged apparatus rather than marketing cards.
- **Motion:** 220–320 ms state transitions on prompt excerpt, score trace, named check rows, and diagnosis only. Explicit tabs/buttons remain keyboard-operable. Reduced motion uses instant state changes; default expert summary and all essential text remain visible.
- **Strength:** strongest direct proof of “same baseline, different human.” It uses real product evidence, preserves inner-product continuity, and can fit the first two viewports without cinematic media.
- **Failure mode:** if reduced to a generic chart plus score, it becomes dashboard chrome. The implementation must retain the constant rail, human-readable thresholds, prompt-state diagnosis, and links to actual runs.

## Direction C — Specification Relay

**Rendered study:** `direction-c-specification-relay.png`

A bolder, motion-led system in which visible brief, structure, and domain judgment behave like physical handoffs moving toward a hard evaluator gate. Saturated coral makes the landing feel like a competitive event rather than a product dashboard.

- **Narrative:** challenge → spec fragments accumulate → evaluator gate → survival verdict.
- **Visual system:** coral-drenched field, black evaluator gate, hard-offset paper fragments, yellow/white/green content roles.
- **Motion:** fragments advance only on explicit state changes; no autoplay loop. Instant stacked layout under reduced motion and narrow screens.
- **Strength:** most memorable and expressive; it gives the landing a campaign-level identity.
- **Failure mode:** the relay is metaphor before evidence. The coral identity sharply departs from the established graphite product and could make a benchmark feel promotional. It also adds responsive choreography without increasing construct clarity.

## Medium decision

| Medium | Narrative value here | Performance/accessibility | Decision |
|---|---|---|---|
| Semantic DOM + CSS/Motion | Directly updates real prompt/run/check state | Best; semantic controls and instant reduced-motion state | **Use** |
| Static SVG data trace | Clarifies the 3→7→10 progression | Lightweight with text equivalent | **Use sparingly inside the instrument** |
| Generated video | Spectacle does not make specification quality inspectable | Heavy; pause/caption/fallback cost | Reject |
| Generated frame sequence | Can dramatize change but duplicates DOM evidence | High transfer/memory and maintenance cost | Reject |
| Canvas/WebGL | Could draw a curve, but no unique explanatory gain | Separate semantic equivalent and custom runtime | Reject |
| Existing generated raster backgrounds | Atmospheric only; current files are 1.1–1.2 MB each | Mobile decode/transfer cost; weak thesis value | Do not use in the selected hero |

## Decision matrix

Scores are 1–5, where 5 is strongest. Weights reflect the run acceptance criteria.

| Criterion | Weight | A — Cut Line | B — Human-Spec Gap | C — Spec Relay |
|---|---:|---:|---:|---:|
| First-two-viewports thesis clarity | 25 | 4 | **5** | 4 |
| Product truth / real evidence | 20 | 4 | **5** | 3 |
| Distinctiveness without category cosplay | 15 | 2 | **4** | 5 |
| Motion/media narrative value | 10 | 3 | **5** | 4 |
| Accessibility | 10 | **5** | **5** | 4 |
| Performance | 8 | **5** | **5** | 4 |
| Maintainability | 7 | **5** | **5** | 3 |
| Fit with established PromptGolf brand | 5 | 4 | **5** | 2 |
| **Weighted total / 500** | 100 | **384** | **490** | **375** |

## Selected direction

**Select Direction B — The Human-Spec Gap. Do not average it with the other studies.**

Why it wins:

1. It makes the held-constant baseline explicit instead of asking visitors to infer it.
2. It puts the scarce human judgment and real seeded run evidence in the same instrument.
3. It explains the teachable middle state rather than presenting expertise as innate or binary.
4. It uses motion only where state changes carry meaning.
5. It preserves PromptGolf’s graphite, amber, pass/fail, Inter, and mono product language while giving the landing one stronger brand-level apparatus.
6. It rejects video/WebGL not from conservatism, but because direct evidence is more exact, faster, more accessible, and more ownable for this thesis.

### Implementation guardrails for M3

- Keep the entire current product architecture and routes intact; replace only the landing narrative/components needed for this direction.
- Use real `naive-checkout`, `structured-checkout`, and `expert-checkout` seeded data. Never invent aggregate acceptance rates, user counts, or endorsements.
- Build one semantic three-state comparator, not three identical cards. Use tabs or a radio-like segmented control with correct keyboard behavior and readable focus.
- Keep the constant rail visible: same checkout challenge, same builder, same evaluator. Provider wording must match project policy.
- Include concrete named checks such as integer cents, promo normalization, shipping-threshold order, stock limits, and double-submit prevention.
- Default content must render without animation. Motion may enhance state transitions but must never gate visibility.
- Use `prefers-reduced-motion` for instant transitions and verify the same content remains available.
- Avoid a page-wide raster background. The existing 1.2 MB hero background does not carry the selected thesis strongly enough.
- Keep display tracking at or above `-0.04em`, body text at accessible contrast, touch targets at least 44 px, and mobile content free of horizontal overflow.
- Methodology moves after the human-spec gap proof. Retain it as credibility, not as the second-viewport protagonist.

## Render verification

The three studies were rendered from `direction-studies.html` in headless Chrome and visually inspected:

- `direction-a-cut-line.png` — 1440×1000; complete composition, no clipping observed.
- `direction-b-human-spec-gap.png` — 1440×1200; complete instrument and conclusion visible.
- `direction-c-specification-relay.png` — 1440×1000; complete composition, no clipping observed.
- `direction-b-mobile.png` — true 390×1800 viewport captured through Chrome DevTools Protocol. Runtime metrics reported `innerWidth: 390`, `scrollWidth: 390`, so the selected study has no horizontal overflow. A first mobile capture exposed clipping caused by Chrome's command-line minimum viewport; CDP emulation and mobile min-width fixes produced the verified artifact.

The studies are static evidence artifacts, not claims that production interactions are implemented. Production keyboard, focus, reduced-motion, contrast, and responsive behavior remain M3/M4 gates.

## Gate status before Judge

- Three genuinely distinct directions: complete.
- Terminal/minimalist option included and explicitly challenged for category cosplay: complete.
- Direction comparison matrix: complete.
- Autonomous selection recorded: complete, pending read-only Judge review.
- Production source edits: none.
