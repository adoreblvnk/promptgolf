# PromptGolf landing redesign — M4 visual hardening pass 01

**Date:** 2026-07-14 (SGT)
**Mode:** production-browser inspection → bounded OpenCode hardening → independent Hermes verification
**Selected direction:** B — The Human-Spec Gap

## Production-browser inspection

The accepted M3 tree was rendered at desktop, tablet, and true narrow widths before this pass. The landing hierarchy, comparator evidence, seeded/live distinction, and methodology sequence remained coherent. Direct browser metrics found no document or body overflow and no console or failed-request errors at 1440, 1024, and 390 CSS pixels.

The material issue was the shared top navigation on narrow screens:

- brand and destination links used 36px minimum heights despite the documented 44px primary-navigation target;
- `Methodology` collapsed to an unexplained icon at 390px;
- the initial inactive `text-ink-muted` token measured approximately 4.37:1 against the `#15171b` header, below the 4.5:1 WCAG AA threshold for 13px text.

## Bounded implementation pass

OpenCode was given one narrow task: preserve the existing 52px product shell while making all destinations named, understandable, tappable, and contained at 320–390px. The resulting pass was independently inspected and refined:

- the semantic `<nav>` now carries `aria-label="Primary navigation"`;
- the home link has the stable accessible name `PromptGolf home`;
- home and every destination now have a 44×44px minimum target; the desktop/tablet `Player 01` link is also 44px high;
- narrow screens show concise labels `Problems`, `Leaders`, `Runs`, and `Method`, while full desktop labels and icons remain intact from `sm` upward;
- the destination group distributes within the available narrow width, then returns to compact left grouping on desktop;
- inactive navigation text uses `text-ink-soft`, measured at approximately 7.78:1 against the header;
- focused Playwright coverage now protects 320px names, labels, 44×44px geometry, 52px shell height, horizontal containment, and the desktop `Player 01` target.

The first OpenCode verification reused a stale Next dev child process that returned 404 for dynamic routes. After terminating the actual listener and starting a fresh server, `/runs/naive-checkout` and `/challenges/mini-checkout-promo-engine` both returned HTTP 200 and the full focused landing spec passed. This was an environment/process-lifetime issue, not an accepted application failure.

## Final-tree visual evidence

Production-build screenshots were regenerated after the final contrast repair:

- `m4-desktop.png` — 1440×2191
- `m4-tablet.png` — 1024×2350
- `m4-mobile-final.png` — true 390×3483
- `m4-mobile-320-nav.png` — 320×720 focused navigation/hero capture

Runtime metrics:

- 1440: `innerWidth=1440`, `document.scrollWidth=1440`, `body.scrollWidth=1440`
- 1024: `innerWidth=1024`, `document.scrollWidth=1024`, `body.scrollWidth=1024`
- 390: `innerWidth=390`, `document.scrollWidth=390`, `body.scrollWidth=390`
- 320: `innerWidth=320`, `document.scrollWidth=320`, `body.scrollWidth=320`

All four production-build captures reported zero browser console/page errors, zero failed requests, and no Next.js development overlay. At 320px, the visible targets measured `44×44`, `66×44`, `59×44`, `44×44`, and `55×44` CSS pixels; destination text computed to 13px. At 1024px, all six visible navigation links measured 44px high, including `Player 01`.

## Independent verification

- `npm test` — 18 files, 133 tests passed in 3.00s on the final tree.
- `npx eslint .` — passed.
- `npm run build` — passed; Next.js 16.2.9 compiled successfully, TypeScript passed, and 28 static pages were generated. Seeded run and challenge routes were present in the route manifest.
- `git diff --check` — passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3217 npx playwright test e2e/landing.spec.ts` — 5/5 focused Chromium tests passed in 4.7s on the final tree, including the 320px/1024px navigation regression and the linked seeded-scorecard truthfulness check.
- Secret/transient-artifact scan — no `.env`, key, credential, Playwright report, trace archive, or test-result artifact appeared in the intended diff/status set.
- Full `npm run test:e2e` was not run, per project policy.

## Files in this pass

- `src/components/promptgolf/chrome.tsx`
- `src/components/promptgolf/product-nav.tsx`
- `e2e/landing.spec.ts`
- `evidence/landing-redesign/m4-pass-01.md`
- `evidence/landing-redesign/m4-desktop.png`
- `evidence/landing-redesign/m4-tablet.png`
- `evidence/landing-redesign/m4-mobile-final.png`
- `evidence/landing-redesign/m4-mobile-320-nav.png`

## Read-only Judge and repair cycle

The first independent Judge returned **APPROVE WITH FIXES** with two material P2 findings:

1. the 44px regression checked only height, while the home and short `Runs` targets could remain narrower than 44px;
2. the desktop/tablet `Player 01` link remained 32px high.

One bounded repair added 44px minimum widths to home/destination targets, raised `Player 01` to 44px, and extended the regression to assert both dimensions at 320px plus the player target at 1024px. The follow-up read-only Judge returned **APPROVE** with no unresolved P0, P1, or material P2. No PR has been opened.
