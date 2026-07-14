# PromptGolf landing redesign — research pass 02

**Inspected:** 2026-07-14 (SGT)
**Scope:** 8 additional directly inspected live sources, focused on individual mastery, benchmark credibility, and motion-led storytelling.
**Gate status:** second substantive M1 pass; 16 directly inspected live sources across passes 01–02; **no production source was edited**.

## Research questions answered

### 1. How can individual mastery feel aspirational without institutional ceremony?

The strongest pages make the standard legible and let the participant’s record carry the status:

- Advent of Code turns completion into a visible, personal map. It does not need medals, luxury imagery, or exclusion language.
- Topcoder makes expertise inspectable through named people, specialties, tenure, and exact win counts. Its weakest copy is the generic enterprise positioning; its strongest proof is the human record.
- IOI’s language is explicit about exceptional talent and medal preparation, but prestige comes from the selection system, historical continuity, and named events—not visual polish.

For PromptGolf, the elite signal should be **earned survival under a disclosed contract**. The page should make advancement visible as naive → structured → expert and connect the expert state to a real run record. “Open entry, hard standard” is more credible than “exclusive community” language.

### 2. Can naive → structured → expert be one continuous instrument?

Yes. METR provides the most useful structural precedent: one primary measure, a few meaningful controls, human-readable anchors on the scale, and a link to the underlying method/data. PromptGolf can stage one checkout challenge and keep the environment constant while the human specification changes.

The instrument should have:

1. a constant rail naming the same challenge, same builder/model posture, and same evaluator;
2. three selectable specification states: naive, structured, expert;
3. one persistent run surface whose prompt excerpt, passed checks, hidden survival, and diagnosis update together;
4. human-readable threshold annotations such as “visible app,” “production boundaries,” and “domain traps,” rather than an abstract score-only chart;
5. direct links to the corresponding seeded run evidence.

This is stronger than three unrelated cards because the visitor sees that **the model is held constant and the human variable changes**.

### 3. Which motion medium best carries the story?

**Recommendation entering M2: DOM/CSS state choreography, not generated video, frame sequences, canvas, or WebGL.**

- Apple demonstrates what frame/video-led storytelling can do when the physical subject itself is the story. It also demonstrated the cost: in the inspected full-page render, multiple media-led sections occupied enormous blank regions while controls and text survived. The hero had a pause control and meaningful image alternative, but the media path remained fragile under automated capture.
- Raycast uses large product simulations and scroll pacing to create atmosphere, but the inspected render had very long low-information gaps, faint content, and a page length disproportionate to the core story.
- METR proves that direct, interactive data can be the visual centerpiece without cinematic media.
- Advent of Code proves that a distinctive, lightweight state map can create identity without motion at all.

PromptGolf’s transformation is symbolic/data-driven, not physical. A generated video would illustrate an idea less precisely than the actual run evidence. A canvas/WebGL scene would add rendering and accessibility cost without improving the proof. The smallest medium with the strongest narrative value is a semantic DOM instrument with short transitions between three real states.

## Additional directly inspected live sources

### 9. Advent of Code

**URL:** https://adventofcode.com/
**Category:** individual mastery / competitive programming

- The page is essentially one completion instrument: a yearly ASCII scene with numbered days and stars. Progress literally changes the scene, making mastery personal and cumulative.
- Status is self-evident: calendar, leaderboards, stats, and day links. There is no inflated “elite” copy; the difficulty is implied by the ritual and progression.
- Visually inspected at desktop: dark navy canvas, one monospaced green/gray vocabulary, fixed-width ASCII composition, sparse navigation, and a sponsor column. Content loaded completely and immediately.
- Motion is not required for identity. The evolving ASCII artifact is memorable because every mark has state meaning.
- Accessibility strengths: real headings, links, navigation landmarks, terse labels. Risks: ASCII art has poor semantic value without an equivalent, subdued gray strokes approach low contrast, and the wide fixed composition can become awkward on narrow screens.
- Performance posture appears excellent: mostly text, almost no decorative media, and no hydration-gated proof.
- **PromptGolf implication:** a “test-survival map” or score trajectory can become the ownable artifact if every mark corresponds to a real check. Do not copy terminal aesthetics; borrow the economy and state density.

### 10. International Olympiad in Informatics

**URL:** https://ioinformatics.org/
**Category:** elite selection / competitive programming

- The site explicitly describes bringing together “exceptionally talented pupils” and provides a beginner path framed as preparation to win a medal.
- Prestige is institutional but inspectable: regulations, committees, awards, journals, event editions from 1989 onward, hosts, and current task-explanation material.
- Selection is visible through national contests and the international event, even though the landing page does not dramatize the funnel as clearly as ICPC.
- Interaction is conventional document navigation rather than spectacle. News, events, statistics, journal, history, and governance are primary.
- Mobile/performance risk is more about information volume and long chronology than media. The content remains useful without animation.
- **PromptGolf implication:** durable archives and exact run histories confer more status than performative exclusivity. The landing should hint at a record that can be revisited, compared, and verified.

### 11. METR

**URL:** https://metr.org/
**Category:** AI evaluation / benchmark credibility

- The first major proof is an interactive task-completion time-horizon chart. It translates model capability into a human-readable unit: the length of software tasks completed at a chosen success probability.
- Controls are meaningful rather than decorative: benchmark version, log/linear scale, 50%/80% success, and data download. The page links to the paper and repository.
- Visually inspected at desktop: a restrained white research surface, split hero, then the benchmark chart paired with a concise explanation. The chart’s task anchors (“answer question,” “find fact on web,” “train classifier,” etc.) make the scale understandable.
- Credibility is layered: exact version/date, uncertainty/error bars, methodology links, downloadable data, partner disclosure, “no compensation” statement, and independent/company-involved labels.
- Motion is subordinate to data interaction. Default content was fully visible; controls were semantic buttons and grouped toggles in the accessibility tree.
- Accessibility/mobile risks: detailed chart labels and control density will compress on narrow screens; some fine grid/annotation text is small. The page otherwise has clear headings and conventional reading order.
- **PromptGolf implication:** annotate the human-spec gap with concrete engineering boundaries, not only percentages. Put the constant conditions and evidence links beside the comparison.

### 12. GitHub

**URL:** https://github.com/
**Category:** developer brand

- The current opening positions developers, agents, and code as collaborators: “The future of building happens together.” AI is integrated into the workflow rather than framed as opponent or replacement.
- Narrative sequence follows the actual lifecycle: code, plan, collaborate, automate, secure. Product proof is tied to tools such as Copilot, Actions, Projects, Issues, Dependabot, and code security.
- Status is established through platform breadth and concrete outcome/customer evidence, but the page also leans on large aggregate claims and enterprise proof that PromptGolf cannot honestly emulate yet.
- Interaction is product-category navigation plus deep links; the landing is long and broad because GitHub sells a platform, not one thesis.
- Accessibility is strengthened by real headings, form controls, links, and descriptive product sections. Performance risk comes from the number of product scenes, stories, and long-page media.
- **PromptGolf implication:** use “human + agent + evidence” language. The human supplies judgment, the agent builds, and the evaluator records reality. Avoid anti-AI rhetoric and avoid pretending PromptGolf has GitHub-scale social proof.

### 13. Raycast

**URL:** https://www.raycast.com/
**Category:** motion-led developer brand

- The hero commits to a physical metaphor: saturated red shortcut bands behind “Your shortcut to everything.” The first deep product demonstration is a large simulated Raycast window, followed by a keyboard-shaped story about speed, ergonomics, native performance, and reliability.
- Visually inspected at desktop: dark near-black field, red identity material, large staged product frames, then a long sequence of interactive/product scenes.
- Its best move is to show the real interface doing a recognizable job immediately after the claim. Its worst move is pacing: the inspected full-page render contained very large low-information gaps and multiple sections where content was extremely faint.
- The accessibility tree exposes real headings, links, a named install disclosure, tabs, and descriptive image alternatives. However, very low-contrast gray text and motion-dependent emphasis are material risks.
- The page carries many images, simulations, extension tiles, testimonials, and long-scroll transitions. It creates polish but also high transfer/render cost and narrative sprawl.
- **PromptGolf implication:** show the actual evidence instrument at hero scale, but do not imitate the endless dark cinematic scroll or keyboard/terminal cosplay. One controlled transformation is enough.

### 14. Cursor

**URL:** https://www.cursor.com/
**Category:** AI developer brand

- The opening is direct: “your coding agent for building ambitious software,” followed by an agent-run product scene that includes explored files, elapsed work, a built dashboard, and a walkthrough.
- The page correctly keeps human agency in decisions: agents perform implementation while the user focuses on making decisions and review.
- Proof is operational: autonomous runs, parallel work, terminal/Slack/GitHub surfaces, schedules/triggers, codebase understanding, changelog, and research posts.
- The hero product simulation is information-rich but includes synthetic example content. PromptGolf should instead use its real seeded challenge/run data because its entire proposition is evaluation truth.
- The site leans heavily on endorsements, logos, adoption claims, and product breadth. These are strong incumbent-brand signals but unavailable and inappropriate for PromptGolf.
- Accessibility/performance risks follow from dense animated product simulations and a long repeated page. Text extraction showed duplicated major content, suggesting complex client rendering/serialization that should not be emulated.
- **PromptGolf implication:** the sharp role split is useful—agent builds, human decides—but PromptGolf’s differentiator is that decisions are tested. Show the builder as a constant instrument, not the hero.

### 15. Apple AirPods Pro

**URL:** https://www.apple.com/airpods-pro/
**Category:** motion-led product storytelling

- The hero uses full-width human/product motion to support one physical claim, with the product and headline anchored over the scene. A visible pause control gives motion agency.
- Accessibility semantics were unusually explicit: the hero image alternative names AirPods and animation; a button is labelled “Play animation of a dancer wearing AirPods Pro 3”; highlights are real tabs; the product viewer is a focusable region.
- The narrative uses one claim per long section and lets motion/scale create transformation. This is effective for material qualities such as fit, movement, noise control, and spatial audio.
- The inspected desktop full-page render exposed the failure mode directly: after the loaded hero, several enormous white/gray/black regions appeared with missing media while headings, text, carousel arrows, and controls remained. The browser console showed no uncaught JS errors, so the blankness appears tied to lazy media/scroll state rather than a simple crash.
- Region-selection chrome also occupied the top of the experience, a reminder that modal banners can distort the first viewport.
- Mobile cost would be substantial: large video/frame sequences, scroll-linked state, long reserved aspect-ratio regions, and touch carousels all need alternate assets and careful memory limits.
- **PromptGolf implication:** do not use generated video or frame sequences for a nonphysical data transformation. Preserve the useful principles—one claim per scene, explicit pause/play semantics, and meaningful fallback content—inside a much lighter DOM implementation.

### 16. Topcoder

**URL:** https://www.topcoder.com/
**Category:** elite human expertise / competitive marketplace

- The most credible elite signal is not the enterprise headline; it is the roster of named specialists with member-since dates, domains, languages, and exact win counts (for example, 60, 104, 144, 170, and 363 wins on inspected profiles).
- Human + AI is framed as hybrid delivery rather than rivalry. The platform claims value from expert problem solvers, AI, crowd diversity, validation coverage, and pay-for-results execution.
- The landing’s weakness is excessive breadth and repetition: “Fueling Innovation,” “Where We Play,” “Powering Enterprise Outcomes,” and “Where You Win” spread across many overlapping capability lists; some hero/CTA content was duplicated in extraction.
- Status labels and counts are useful, but generic “elite global talent” language is less persuasive than the individual records immediately below it.
- Accessibility/performance risks come from repeated marketing sections, long lists, and dense talent cards. The information architecture asks the homepage to serve buyers, talent, AI benchmarking, delivery, and staffing simultaneously.
- **PromptGolf implication:** let a player’s run history and verified challenge record earn “elite.” Avoid unsupported hiring/talent-market claims and avoid broad platform copy before the core benchmark is proven.

## Cross-source synthesis

### A fair elite-selection story

PromptGolf’s landing should say, visually and structurally:

- **AI capability is available to everyone.** The same builder is the baseline.
- **Structure improves the attempt.** A compact engineering spec covers the public contract and more failure states.
- **Domain judgment creates separation.** The expert remembers cents math, shipping threshold order, stock limits, idempotency, loading/error states, and mobile behavior.
- **Evidence decides.** Hidden tests—not taste, prompt length, or implementation resemblance—determine survival.
- **Status is earned and inspectable.** A high score links to the run, checks, prompt count, and generated product evidence.

This is aspirational without insulting novices or pretending AI is weak. The rare human is the person who can turn abundant model capability into reliable software through precise judgment.

### Recommended first-two-viewports sequence

1. **Viewport one — thesis + constant conditions.**
   Headline direction: abundant AI made building cheap; reliable specification is now scarce. Pair it with the real ecommerce challenge and a compact constant rail: same challenge · same builder · same evaluator.
2. **Viewport two — the human-spec gap instrument.**
   One persistent run surface moves through naive → structured → expert. The generated app remains visually plausible in all three states while hidden-test survival, named failure boundaries, prompt excerpt, and diagnosis change. The conclusion is visible in the instrument: structure is teachable; domain expertise wins.
3. **Only after proof — methodology and entry.**
   Explain positive behavior evidence, spec completeness, artifact adapters, then invite the visitor to inspect the challenge or submit a prompt.

### Motion mechanics to carry into direction studies

- Default state must be fully visible before JavaScript or animation.
- Use a segmented control or scroll-linked progressive enhancement to select naive/structured/expert; keyboard operation must be equivalent.
- Transition only the fields that encode transformation: prompt excerpt, passed-check rows, score trajectory, and diagnosis summary.
- Keep duration around 220–400 ms with opacity/transform/clip changes; do not animate layout height across the whole viewport.
- Preserve a static three-state summary under `prefers-reduced-motion: reduce` or make state changes instant.
- Do not autoplay a perpetual loop that prevents inspection.
- Do not pin the page for multiple empty viewports. If scroll drives the state, keep the section short and provide explicit controls.

### Media decision matrix for M2

| Medium | Narrative precision | Performance | Accessibility | Maintainability | Decision |
|---|---:|---:|---:|---:|---|
| Semantic DOM + CSS/Motion state changes | High: real prompt/run/test data | High | High with tabs/buttons and static fallback | High; uses existing stack | **Advance** |
| Generated video | Low–medium: spectacle, weak evidence inspectability | Low | Requires captions, pause, fallback | Medium–low; regeneration and compression | Reject for core story |
| Generated frame sequence | Medium if art-directed, but still indirect | Low | Static fallback required | Low; many assets and scroll coupling | Reject |
| Canvas/WebGL | Medium; could draw a trajectory | Medium–low | Separate semantic equivalent required | Low–medium; bespoke rendering | Reject unless a later study proves unique value |
| Static raster illustration | Low for transformation, medium for atmosphere | Medium | Decorative or needs equivalent | Medium | Use only if a specific direction earns it |
| Static SVG/data visualization | High if tied to real checks | High | Good with text equivalent | High | Advance as a secondary motif |

## M1 exit recommendation

M1’s research gate is satisfied: two substantive passes and 16 directly inspected live sources cover competitive selection, AI evaluation, developer brands, and motion-led storytelling. The next milestone should create three deliberately separate studies rather than averaging references:

1. a terminal/minimalist state-map direction inspired by the economy—not the costume—of Advent of Code;
2. an evidence-instrument direction centered on the same-baseline human-spec gap, informed by METR;
3. a bolder motion-led brand direction that preserves real DOM evidence and rejects Apple/Raycast-scale media fragility.

No production source changes should begin until those studies, a comparison matrix, selected direction, and read-only Judge critique are recorded.
