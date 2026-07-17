# PromptGolf landing redesign — research pass 01

**Inspected:** 2026-07-14 (SGT)
**Scope:** current product surface + 8 directly inspected live sources across competitive selection, AI evaluation, developer brands, and motion-led product storytelling.
**Gate status:** first of at least two M1 research passes; **no production source was edited**.

## Research stance

PromptGolf should not imitate an online judge, an AI leaderboard, or a polished developer SaaS page. The useful synthesis is narrower:

- elite selection becomes credible through a visible progression and a hard, legible standard;
- evaluation becomes credible through disclosed harness structure, comparable evidence, and links to underlying runs;
- transformation becomes memorable when the page shows the *same task* crossing from plausible output to production-surviving output;
- the scarce actor must remain the human spec writer. AI is the baseline instrument, not the hero or enemy.

## Current landing and asset audit

### What exists

- `src/app/page.tsx` is a short two-section landing page: insult-led hero, naive/expert hidden-test comparator, then three evaluator-pillar cells.
- The strongest existing artifact is `HeroComparator`: it uses real seeded run data and names concrete ecommerce failure modes (cents math, promo normalization, discount floor, shipping threshold, stock, double submit, quantity boundaries).
- Existing product shell is matte graphite with amber/pass/fail tokens, Inter + IBM Plex Mono, restrained radii, visible focus treatment, and a global reduced-motion override.
- Existing history shows the landing was recently reframed from provider plumbing to positive evaluation pillars. This is technically accurate, but it shifted the second viewport toward evaluator architecture rather than the human transformation story.

### Narrative findings

1. **The hook currently attacks before it proves.** “Your models don’t have a skill issue. You do.” is memorable, but it frames the visitor as deficient before showing the fair standard. “Start promptmaxxing” reads as trend slang rather than elite selection infrastructure.
2. **The proof is better than the positioning.** The comparator immediately demonstrates why a plausible checkout can still fail reality. It should become the central narrative instrument rather than a card adjacent to marketing copy.
3. **The missing middle matters.** Product context requires naive → structured → expert. The hero only offers naive/expert, so the transformation reads binary and innate rather than teachable structure plus domain expertise.
4. **The human is not yet visible as the scarce layer.** The page says “benchmarks the spec writers,” but does not stage the model as constant while human specification quality changes the outcome.
5. **The second viewport is too architectural.** “Behavior evidence / spec completeness / artifact adapters” earns credibility later, but it does not complete the first-two-viewports story. A visitor should first see same model, same task, different human judgment, different hidden-test survival.
6. **Motion is stateful but not narrative.** Current transitions are sound and reduced-motion-safe, but they do not dramatize transformation. A single controlled progression through naive → structured → expert would be more valuable than broad scroll effects.

### Asset findings

- `public/images/promptgolf-share-card.png` — 1536×864, ~536 KB. Existing social asset; not assessed as a landing-page visual in this pass.

### Current technical/accessibility risks to verify later

- The comparator’s failed-reason and status labels are `shrink-0`; narrow mobile widths may squeeze or truncate the test name rather than reflowing.
- Local visual rendering could not run in this checkpoint because dependencies are not installed (`next: not found`). Source and asset inspection remained read-only; browser verification belongs to the implementation/hardening milestones after dependency setup.

## Directly inspected live sources

### 1. Kaggle Competitions

**URL:** https://www.kaggle.com/competitions
**Category:** competitive selection / AI competition

- Opens with a plain institutional promise: “The world’s most important AI problems, open to anyone,” then immediately exposes competition taxonomy and real live entries.
- Difficulty is progressive rather than boastful: “Getting Started” is explicitly separated from Featured, Research, Playground, Simulations, and Hackathons.
- Evidence/status is embedded in the catalog: organizer, competition type, prize, and team count travel with each item.
- Interaction is utilitarian: search, filters, horizontal category chips, “see all,” and dense lists. Status is discoverable without animated storytelling.
- Accessibility is comparatively strong in the inspected tree: landmark navigation, named controls, checkbox filters, clear headings, and skip-to-content. The persistent cookie bar competes with content on shorter viewports.
- **PromptGolf implication:** use an explicit progression tier, but attach it to run evidence. “Open to anyone; elite by result” is stronger than manufactured exclusivity.

### 2. ICPC

**URL:** https://icpc.global/
**Category:** elite competitive programming / selection

- Prestige is built through a real funnel: local/regional contests → invitations → World Finals. The copy repeatedly explains that success at one level advances teams to the next.
- Human identity is central: team photographs, named winners, coaches, universities, geographic regionals, and a celebratory final. The standard feels elite because people visibly crossed it.
- The strongest language is tied to process (“perform under pressure,” “the best teams advance”), not merely to a luxury visual treatment.
- The current page is visually inconsistent and heavy: a full-bleed Dubai event hero, large map, oversized serif section headings, skeleton/loading blocks, and long vertical gaps. This weakens the otherwise excellent progression narrative.
- **PromptGolf implication:** borrow the *selection ladder*, not the visual language. Show how a player advances from plausible output to hidden-test survival, and eventually to ranking/recognition.

### 3. SWE-bench official leaderboards

**URL:** https://www.swebench.com/
**Category:** AI evaluation / benchmark credibility

- Credibility is established before the table: the active benchmark is a named human-filtered 500-instance subset and all models are evaluated with the same harness.
- Comparability is explicit: benchmark tabs, agent/model filters, sortable columns, checkboxes for comparison, resolved percentage, average cost, trajectories, date, organization, and agent version.
- “Official Leaderboards” and linked trajectories create status without decorative exclusivity. Freshness is carried by exact dates and version numbers.
- The design is visually modest but information-dense; evidence hierarchy is excellent. On small screens, the wide table and persistent sidebar are likely pressure points.
- **PromptGolf implication:** disclose the constant conditions near the comparison: same challenge, same builder/model posture, same evaluator contract. Link claims to run evidence rather than inventing aggregate prestige metrics.

### 4. Arena leaderboard overview

**URL:** https://arena.ai/leaderboard (redirected from `lmarena.ai`)
**Category:** AI evaluation / comparative ranking

- The overview separates modalities/arenas and presents ranking with uncertainty (for example score or improvement plus ± ranges), which communicates that evaluation is measured rather than absolute.
- “Start Voting” makes the evaluation mechanism participatory, while “Edit View” and one/two-column layout controls make comparison configurable.
- The inspected page created a very large accessibility tree (thousands of elements) and the screenshot captured partially loaded/blank promotional and result regions. That is a cautionary example of runtime and rendering complexity overpowering the core evidence.
- **PromptGolf implication:** uncertainty disclosure is useful where applicable, but PromptGolf’s deterministic behavior checks should remain simpler: passed/total, named evidence category, prompt count, and a direct run link. Do not build a configurable analytics dashboard into the landing.

### 5. ARC Prize

**URL:** https://arcprize.org/
**Category:** AI benchmark + prize + human/AI gap storytelling

- This is the most directly relevant reference. It uses one thesis (“The North Star for AGI”), one striking interactive/play CTA, prize stakes, partner proof, and then actual charts that expose the gap between human and AI performance.
- Difficulty is shown through benchmark data, not only claimed. “Low-noise, high-signal” is followed by a time-series chart and a dedicated Human–AI Gap visualization.
- Status comes from official leaderboards, a testing policy, named partners, current competition tracks, and founder identity.
- Visual storytelling uses pixel/grid motifs and a restrained black field with high-chroma accents. The media supports the benchmark’s subject instead of acting as generic decoration.
- Risks: the dark pixel/mono aesthetic is close to category cosplay, social-post cards are generic proof chrome, and some chart labels are small/low contrast.
- **PromptGolf implication:** build a bespoke **human-spec gap** visualization from real seeded runs. The ownable idea is not “humans beat AI”; it is “the model is the baseline, and domain-aware specification creates the gap.”

### 6. Linear

**URL:** https://linear.app/
**Category:** developer brand / product storytelling

- The hero makes one category claim, then immediately renders a detailed product workflow rather than abstract illustration. The screenshot demonstrates an issue moving into an agent session, code changes, and review.
- The long page is organized as operational outcomes: intake, plan, build, diffs, monitor. Each section uses real product-like UI and concise outcome copy.
- Subtle live-state details (In Progress, activity timestamps, changed files, draft PR, risk/on-track states) make the product feel real and current.
- Distinctive strength: product evidence is the imagery. Generic weakness: black-and-gray “AI-era developer tool,” customer-logo strip, and repeated oversized two-column sections are now widely copied.
- The page is very long and visually dense; low-contrast gray text and tiny UI details need careful accessibility treatment, and animated product simulations can be expensive if reproduced naively.
- **PromptGolf implication:** use a real score/run surface as the hero visual, but avoid copying Linear’s monochrome monumentality or turning the entire page into a sequence of giant faux product screenshots.

### 7. Vercel

**URL:** https://vercel.com/
**Category:** developer infrastructure brand

- Current hero is extremely sparse: “Agentic Infrastructure,” two CTAs, the triangle mark, terse mono capability lines, and a customer-logo strip. The next section uses a customer/product scene to translate infrastructure into visible use.
- Brand status comes from confident reduction, the iconic mark, and recognizable customers—not from explaining difficulty or evaluation.
- In the inspected browser render, large regions remained blank while the early page loaded. That exposes the risk of heavy staged animation/media or hydration-gated content: the brand moment can become absence in headless, reduced-resource, or interrupted contexts.
- **PromptGolf implication:** do not equate elite with emptiness or ultra-minimal black/white developer branding. Default content must remain visible, and proof must not wait for animation.

### 8. Stripe

**URL:** https://stripe.com/en-sg
**Category:** motion-led product storytelling / developer brand

- The opening uses an animated chromatic field as atmosphere, but the proof stack is concrete: customer logos, working product scenes, infrastructure metrics, uptime link, customer stories, developer paths, and current news.
- Interactions are semantic where inspected: product solution panels are buttons/accordions, controls are named, and visual product media has descriptive alternatives.
- The page uses motion and color to pace a long commercial narrative, but the large media panels visibly load in stages; several screenshot regions remained blank during capture. Transfer, animation, and long-page complexity are real costs.
- Generic patterns to reject: logo wall immediately after hero, huge business metrics, repeated solution-card grid, and decorative gradient field as brand shorthand.
- **PromptGolf implication:** borrow the cadence—claim → concrete proof → deeper system credibility—not the gradient, logo wall, or metric theater. One lightweight state transition tied to the naive/structured/expert evidence is enough.

## Access attempts not counted as inspected sources

- `https://leetcode.com/problemset/` and `https://leetcode.com/` returned Cloudflare verification only.
- `https://codeforces.com/` returned Cloudflare verification only.

No design conclusions were drawn from blocked content.

## Cross-source synthesis for PromptGolf

### What proves difficulty

- a visible progression/funnel (ICPC, Kaggle);
- a named, stable benchmark subset or contract (SWE-bench);
- real failure boundaries and comparative data (ARC Prize);
- exact evidence tied to the artifact, not aesthetic judgment (SWE-bench, Linear product scenes).

### What proves status and exclusivity without fake prestige

- advancement earned through results;
- official/verified labels backed by a disclosed process;
- named winners/rankings and inspectable runs;
- a hard standard that remains open to entrants.

PromptGolf should therefore say, in effect: **anyone can enter; only specs that survive the hidden contract rise.** It should not invent acceptance rates, employer demand, or “top 1%” language.

### What proves transformation

The most ownable first-two-viewports sequence is:

1. **Constant baseline:** same challenge, same builder/model posture, same evaluator.
2. **Human variable:** naive request → structured spec → domain-expert spec.
3. **Observable result:** visible basics remain similar while hidden-test survival rises.
4. **Meaning:** structure is teachable; domain judgment is scarce.

This turns the page from “you have a skill issue” into a fair selection instrument that first demonstrates the gap, then earns the provocation.

### Motion/media recommendation entering pass 02

- Prefer **DOM/CSS state choreography** over generated video, WebGL, or a new raster sequence for the core story.
- A single pinned or staged comparator can reveal naive → structured → expert while keeping all content visible by default and equivalent under reduced motion.
- Retain a static evidence state for reduced motion and no-JS rendering.
- Do not use video merely to create spectacle; no source in this pass suggests video would explain specification quality better than direct run evidence.
- Consider the golf trajectory as a secondary connective motif only if it maps cleanly to prompt strokes and test survival. Avoid blueprint/control-room decoration that does not carry data.

## Questions for research pass 02

1. Which competitive-selection pages make individual human mastery feel aspirational without institutional ceremony?
2. Which motion-led sites use scroll/state transitions while preserving visible default content and fast loading?
3. Can the three-stage transformation be expressed as one continuous instrument rather than three cards or tabs?
4. Which landing patterns communicate “same baseline, different human judgment” without anti-AI framing?
