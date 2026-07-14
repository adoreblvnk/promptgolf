# PromptGolf landing redesign — M5 final verification

**Date:** 2026-07-14 (SGT)

**Selected direction:** B — The Human-Spec Gap

**Tree verified:** `e662ce99983834ae045cf3c31815de0770bac112` before this evidence-only commit

## Acceptance review

The final branch satisfies the landing-redesign acceptance contract:

- two substantive research passes directly inspect and synthesize more than the required 15 live sources across competitive selection, AI evaluation, developer brands, and motion-led storytelling;
- three distinct rendered directions were compared, independently judged, and Direction B was selected before production edits;
- the first two viewports state the held-constant experiment and show the real seeded 3/10 → 7/10 → 10/10 hidden-test separation;
- the page uses real PromptGolf challenge/run data and labels authored seeded references truthfully rather than presenting them as live captures;
- semantic DOM/CSS motion carries state change, default content remains visible, and reduced motion receives instant equivalent updates;
- desktop, tablet, 390px mobile, and 320px navigation evidence exists in this directory;
- independent visual review of the final desktop and mobile captures returned **APPROVE**, with no P0, P1, or material P2 finding;
- independent engineering/security/performance review returned **APPROVE**, with no redesign-introduced P0, P1, or material P2 finding.

## Fresh final-tree gates

Executed from the clean isolated worktree:

- `npm test` — **passed**: 18 files, 133 tests.
- `npm run lint` — **passed**.
- `npm run build` — **passed**: Next.js 16.2.9 compiled, TypeScript passed, and 28 static pages generated.
- `git diff --check origin/main...HEAD` — **passed**.
- Focused production Playwright pass 1 — **passed 5/5** in 3.7s.
- Focused production Playwright pass 2 — **passed 5/5** in 2.4s.
- Production route probes — `/`, `/runs/naive-checkout`, and `/challenges/mini-checkout-promo-engine` each returned **HTTP 200**.
- Changed-file secret/transient scan — **passed** across 28 files: zero sensitive filenames, secret-content hits, or transient artifacts.
- Dependency manifests — unchanged from `origin/main`.
- Production server cleanup — tracked process stopped, surviving listener check completed, and port 3217 confirmed free.

Full `npm run test:e2e` was intentionally not run because the repository requires fresh explicit user authorization. The focused landing suite covers comparator semantics and keyboard behavior, reduced motion, true narrow-width overflow, 320px navigation target geometry, and seeded-scorecard truthfulness.

## Honest limitation

`npm audit --omit=dev --audit-level=high` remains a repository-baseline limitation documented in `m4-pass-02.md`: 16 moderate and 13 high transitive advisories through unchanged Daytona/OpenTelemetry/protobufjs and Next/PostCSS dependencies. This branch changes neither dependency manifest nor provider boundary, and npm's proposed fixes cross breaking-version boundaries; remediation belongs in a separate compatibility upgrade.

## Final verdict

**APPROVE FOR PR.** Research, direction selection, implementation, visual hardening, focused browser verification, deterministic gates, source-integrity checks, and final design/engineering acceptance are complete. No unresolved blocker remains.
