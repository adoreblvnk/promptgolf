# PromptGolf landing redesign — M3 pass 01 Judge record

**Disposition:** APPROVE after two repair rounds.

## Initial review

The first read-only Judge returned **APPROVE WITH FIXES**:

- P1: the comparator overstated authored seeded fixtures as real generated artifact outcomes.
- P1: `HeroComparator` accepted `Run[]` and could crash on an empty filtered result.
- Material P2: no focused interaction/accessibility/mobile/reduced-motion test protected the new comparator.

## Repair round 1

- Qualified the landing instrument as authored seeded reference evidence.
- Added state-specific `screenshotTitle`/`screenshotCaption` context under an explicit “Seeded artifact scenario” label.
- Required a readonly `[Run, Run, Run]` tuple and explicit `requireSeededRun()` lookup.
- Added `e2e/landing.spec.ts` for tab semantics, Arrow/Home/End focus, live announcements, 390px overflow, and reduced motion.

The follow-up Judge found one remaining P1: the inherited expert `screenshotCaption` still said a generated app “survives reality.” All three seeded captions were rewritten as explicit reference statements and covered by a data regression.

## Repair round 2

The next review traced the landing links into `/runs/[id]` and found the seeded scorecard still looked like a fresh execution. The repair:

- Relabeled the shared schematic as a seeded checkout scenario.
- Replaced “Execution timeline” with a reference-scenario record.
- Removed credential-derived seeded statuses and explicit builder/sandbox/Playwright success claims.
- Added fixed reference metadata saying no provider call, sandbox, builder, or Playwright job ran for the fixture.
- Kept `/live-runs/[id]` and the live runner unchanged.
- Extended the focused Playwright spec to follow the comparator link and verify truthful seeded scorecard labels.

## Final Judge

**VERDICT: APPROVE**

- Unresolved P0: none.
- Unresolved P1: none.
- Unresolved material P2: none.
- Rationale: seeded-reference claims are qualified end-to-end, `/live-runs/[id]` is untouched, exact tuple enforcement is present, and focused keyboard/accessibility, 390px mobile, reduced-motion, and linked-scorecard coverage is included.
