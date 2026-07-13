# PromptGolf landing redesign — M4 engineering/security/performance pass 02

**Date:** 2026-07-14 (SGT)
**Mode:** independent engineering review → bounded OpenCode test-hardening repair → repeated production-browser verification
**Selected direction:** B — The Human-Spec Gap

## Scope reviewed

The cumulative `origin/main...HEAD` landing change was reviewed against the selected direction, product truth contract, accessibility requirements, responsive captures, security exposure, client/runtime cost, and focused browser coverage. The Impeccable context script was run from the installed global skill path because the project-relative `.agents/...` copy is absent; it returned `PRODUCT.md` and `DESIGN.md`. The detector returned no anti-pattern hits for the changed landing sources.

Direct inspection covered the landing server component, client comparator, shared chrome/navigation, seeded scorecard destination labels, global motion styles, focused Playwright spec, dependency manifests, cumulative diff, desktop/mobile production captures, and tracked artifacts.

## Visual/design acceptance

Fresh release-level inspection of the final 1440px and true 390px production captures found no P0, P1, or material P2 issue:

- the first viewport states the controlled variable and held-constant conditions clearly;
- the second viewport makes the 3/10 → 7/10 → 10/10 human-spec separation visible with named ecommerce checks;
- seeded/reference provenance is prominent rather than hidden in fine print;
- mobile preserves hierarchy, readable line lengths, named navigation, and a comprehensible vertically stacked comparator;
- no heading overflow, clipping, accidental card-grid repetition, gradient text, glassmorphism, decorative media, or category-terminal cosplay is present.

The page intentionally uses no hero raster/video/WebGL asset: the selected direction treats the comparator itself as the primary product image and avoids media cost that would not add evidence.

## Intermittent focused-test failure and bounded repair

A fresh focused Playwright run was intentionally executed in parallel with a separate Chromium performance probe against the production server. It exposed a real readiness race in the test harness:

1. the keyboard test could press `ArrowRight` before React hydration attached the comparator handler, leaving the structured tab inactive;
2. the 320px navigation could be measured before responsive styles settled, producing a transient 102px measurement with desktop labels visible.

The initial concurrent run therefore failed 2/5 checks. This failure is retained as evidence and was not hidden behind a retry.

A bounded OpenCode repair changed only `e2e/landing.spec.ts`:

- added an observable structured-tab click/selection handshake before keyboard assertions, proving hydration rather than sleeping;
- added explicit mobile-label-visible and desktop-label-hidden checks at 320px;
- changed one-shot geometry and overflow reads to bounded `expect.poll` assertions;
- preserved every original threshold for 44×44 targets, 52px navigation height, overflow, keyboard semantics, reduced motion, and seeded-scorecard truthfulness.

No production source was changed. Independent diff review confirmed the repair remains failure-sensitive: hydration, media-query, geometry, overflow, or route regressions still time out and fail.

## Independent verification after repair

- `npm test` — 18 files, 133 tests passed in 3.21s.
- `npm run lint` — passed.
- `npm run build` — passed before the test-only repair; Next.js 16.2.9 compiled, TypeScript passed, and 28 static pages generated. The repair did not touch production source.
- `git diff --check` — passed.
- Focused production Playwright, OpenCode verification run 1 — 5/5 passed in 6.1s.
- Focused production Playwright, OpenCode verification run 2 — 5/5 passed in 3.0s.
- Independent focused production Playwright under the original concurrent-browser condition — 5/5 passed in 4.3s while the separate probe also passed with zero console/page errors, zero failed requests, and `scrollWidth=innerWidth=1440`.
- Independent focused production Playwright repeat — 5/5 passed in 3.8s.
- Representative production routes before shutdown — `/` 200, `/runs/naive-checkout` 200, `/challenges/mini-checkout-promo-engine` 200.
- Production performance probe — 273 DOM nodes, 39 resources, approximately 339 KB transferred / 1.01 MB decoded, zero measured layout shift, zero console/page errors, zero failed requests, and no image payloads.
- Changed-file secret/transient scan — 27 cumulative changed files scanned; zero sensitive filenames, secret-pattern hits, or transient-artifact hits.
- Dependency manifests — unchanged from `origin/main`.
- Production server cleanup — the tracked npm wrapper was stopped, the surviving Next child listener was terminated explicitly, and port 3217 was confirmed free.

Full `npm run test:e2e` was not run, per repository policy.

## Security/dependency disposition

`npm audit --omit=dev --audit-level=high` reported the repository baseline's existing transitive findings: 16 moderate and 13 high advisories, chiefly through `@daytonaio/sdk@0.187.0` → OpenTelemetry/protobufjs, plus Next.js's nested PostCSS. npm only offered force upgrades that would cross breaking dependency boundaries (`@daytonaio/sdk@0.196.0` or an invalidly regressive Next recommendation). `package.json` and `package-lock.json` are byte-unchanged from `origin/main`, the redesign adds no dependency or provider path, and the changed-file scan found no secret or unsafe-HTML addition. This is recorded as a pre-existing repository limitation for follow-up, not silently “fixed” in a landing-page branch.

## Review verdict

**Hermes engineering/security/performance review: APPROVE.** No unresolved redesign-introduced P0, P1, or material P2 finding remains. The pre-existing dependency audit requires a separately scoped compatibility upgrade, but it is not caused or expanded by this branch.

## Files in this pass

- `e2e/landing.spec.ts`
- `evidence/landing-redesign/m4-pass-02.md`
