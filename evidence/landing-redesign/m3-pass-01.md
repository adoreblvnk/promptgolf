# PromptGolf landing redesign — M3 implementation pass 01

**Date:** 2026-07-14 (SGT)
**Mode:** bounded OpenCode implementation (`opencode run --auto`) followed by independent Hermes verification
**Selected direction:** B — The Human-Spec Gap

## Scope completed

- Replaced the raster-backed provocative hero with the selected controlled-experiment thesis: “Same agent. Same task. Different specification.”
- Added the held-constant rail for the ecommerce checkout challenge, OpenAI `gpt-5.4-mini` builder, and stored EvalSpecs + Playwright behavior evaluation.
- Rebuilt the landing comparator as one persistent three-state evidence instrument using the authored seeded `naive-checkout`, `structured-checkout`, and `expert-checkout` reference records.
- Added seeded reference prompt excerpts, run-derived hidden survival and prompt counts, named ecommerce checks, qualified seeded diagnoses, and actual seeded run links.
- Added equivalent product-plausibility context for all three states from each run's existing `screenshotTitle` and `screenshotCaption`, explicitly labeled “Seeded artifact scenario” and “not a captured or live generated artifact.”
- Added semantic tabs with roving `tabIndex`, Arrow/Home/End navigation, managed focus, ARIA tab/panel relationships, a polite status announcement, and 44px+ controls.
- Removed the page-wide raster hero background. Motion is limited to 240–280ms state/interaction changes with a reduced-motion override.
- Kept methodology after the main proof as secondary credibility.
- Added a seeded-data regression asserting 3/10 → 7/10 → 10/10 and prompt counts 1 → 2 → 1.

## Judge repair disposition

- **P1 — overstated fixture evidence: resolved after one follow-up finding.** “Real prompt excerpt,” render-in-every-state, and expert-survives-reality claims were removed or qualified. A follow-up Judge found that the expert run's inherited `screenshotCaption` still said the generated app “survives reality”; all three seeded captions were then rewritten as explicit `Seeded reference:` statements, and the data regression now rejects a `generated app` claim. The comparator describes authored seeded references, labels diagnoses as seeded interpretations, and does not claim live/generated artifact proof.
- **P1 — seeded scorecard execution overclaim: resolved in repair round 2.** A final read-only Judge found that the landing's linked `/runs/[id]` pages still labeled their shared checkout schematic “generated checkout preview” and presented authored fixture stages as completed OpenAI, Daytona, build, and Playwright work. Seeded scorecards now label the UI “seeded checkout scenario · shared reference schematic,” identify the page as an authored fixed-condition reference, and replace the execution timeline with a “Reference scenario record.” Every fixture stage is `documented`, provider/sandbox metadata is credential-independent, and the record explicitly states that no provider, sandbox, builder, or Playwright job was freshly executed. The separate `/live-runs/[id]` provider-backed UI and path were not changed.
- **P1 — empty comparator crash: resolved.** `HeroComparator` now requires the exact non-empty readonly tuple `[Run, Run, Run]`. The landing page resolves all three required IDs individually and throws `Landing comparator requires seeded run "<id>".` during rendering if any record is missing; it no longer silently filters missing runs.
- **P2 — focused interaction/accessibility coverage: resolved.** `e2e/landing.spec.ts` covers ARIA tab/panel semantics, roving `tabIndex`, ArrowLeft/ArrowRight/Home/End focus and selection, the polite live announcement, all three seeded artifact scenario titles, true 390px no-overflow, reduced-motion computed styles, and navigation through the landing's actual seeded scorecard link to verify the reference labels and absence of the prior preview/timeline overclaims.

## Files changed

- `src/app/page.tsx`
- `src/components/promptgolf/hero-comparator.tsx`
- `src/app/globals.css`
- `src/lib/promptgolf/data.test.ts`
- `e2e/landing.spec.ts`
- `evidence/landing-redesign/m3-pass-01.md`
- `evidence/landing-redesign/m3-pass1-mobile.png`

## Independent verification

- `npm test` — 18 files, 133 tests passed in 3.59s.
- `npm run lint` — passed.
- `npm run build` — passed; Next.js 16.2.9 compiled successfully in 6.3s, completed TypeScript in 5.1s, generated 28 static pages in 978ms, and preserved the three seeded run routes plus the dynamic live-run route.
- `git diff --check` — passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3217 npx playwright test e2e/landing.spec.ts` — 4 focused Chromium tests passed in 3.7s using the already-running worktree dev server; no external provider route was used.
- Desktop focused evidence: the three tabs expose correct `aria-selected`, roving `tabIndex`, `aria-controls`/`aria-labelledby` relationships, managed focus and selection for ArrowLeft/ArrowRight/Home/End, and updated polite announcements for the structured and expert references.
- Seeded-scenario evidence: tab changes expose `Happy-path checkout`, `Robust checkout shell`, and `Production-aware checkout` from the selected run records.
- Seeded-scorecard truthfulness evidence: the landing's `Inspect reference scorecard` link reached `/runs/naive-checkout`; the page exposed `Seeded reference · score fixed`, `seeded checkout scenario · shared reference schematic`, `Reference scenario record`, and `Seeded reference scenario conditions`. The prior `generated checkout preview` and `Execution timeline` labels were absent.
- Mobile focused evidence: `innerWidth` is exactly 390px, while both `document.documentElement.scrollWidth` and `document.body.scrollWidth` are no greater than 390px.
- Reduced-motion focused evidence: after a comparator state change, computed `animationName` is `none` and effective animation duration is at most `0.01ms`.
- Browser accessibility snapshot exposed the hero, held-constant conditions, three tabs, one tabpanel, run links, and the methodology hierarchy.
- Desktop visual inspection found a clear thesis/evidence hierarchy and no clipping at 1280px; DOM measured `scrollWidth === innerWidth`.
- Mobile visual inspection found no horizontal clipping or headline overflow. The mid-page sticky navigation appearance in the full-page PNG is a Playwright full-page stitching artifact, not an in-flow duplicate.

## Notes

- The Impeccable context script was not vendored at the project-relative `.agents/...` path. The same required script was successfully run from `/home/adoreblvnk/.agents/skills/impeccable/scripts/context.mjs`; it returned PRODUCT.md + DESIGN.md and required the product register, which OpenCode then read.
- Full `npm run test:e2e` was not run, per project policy.
- The first focused Playwright invocation could not start a second Next.js dev server because this worktree already had one running on port 3217. The next parallel run against that server passed three existing checks but the new linked-route check timed out during its first cold navigation. That check passed alone in 1.8s, an intermediate complete run passed in 5.4s, and the final complete four-test focused file passed in 3.7s. The final command explicitly reused the existing server. One initial reduced-motion assertion from pass 01 expected the browser string `0s`; Chromium correctly serialized the global `0.01ms` override as `1e-05s`, so the assertion was repaired to check the effective numeric duration. No application behavior changed for that repair.
- Full `npm run test:e2e` was not run. Only `e2e/landing.spec.ts` was run, as required.
- Final independent verification on the accepted tree: `npm test` — 18 files / 133 tests passed; `npm run lint` passed; `npm run build` passed with 28 static pages; `git diff --check` passed; focused `e2e/landing.spec.ts` — 4/4 passed.
- Final read-only Judge verdict: **APPROVE**, with no unresolved P0, P1, or material P2. Full review history is in `m3-pass-01-judge.md`.
