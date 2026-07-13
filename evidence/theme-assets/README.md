# Dark Graphite Theme Assets

Generated on 2026-07-13 with the configured `image_generate` tool (`gpt-image-2-medium`). No source assets from Aditya's repository were copied.

## Assets

### Landing hero

- Path: `public/promptgolf-hero-bg.png`
- Size: 1672×941
- Use: referenced by `src/app/page.tsx`
- Prompt: “PromptGolf landing-page background for a serious developer benchmark, 16:9. Dark graphite and near-black canvas (#0b0d10, #111317), subtle one-pixel technical grid and faint monospaced-code-like line patterns without readable text. On the RIGHT half, an abstract dense online-judge workspace made of restrained flat panels, evaluation rows, tiny status dots, and a precise golf-shot trajectory arc ending at a minimal flag-pin/target motif. Accents only muted amber-orange for submission and restrained green for passing. LEFT 45% must remain quiet, low-contrast negative space for white headline copy. Flat product-design illustration, minimal depth, crisp geometry, subtle grain, no glassmorphism, no gradients, no oversized cards, no red, no logos, no words, no fake screenshot, no laptop/device frame, no people.”

### Hidden-evaluation background

- Path: `public/promptgolf-hidden-tests-bg.png`
- Size: 1672×941
- Use: retained at the existing asset path; intentionally not placed behind dense task-focused screens
- Prompt: “PromptGolf hidden-evaluation background, 16:9, matching a mature dark graphite online judge. Near-black #0b0d10 and graphite #15181d, restrained flat technical linework. Central-right composition: abstract requirement nodes flowing through an evaluation gate into compact rows of hidden checks, some muted green passes and a few low-saturation failure marks, with a very subtle golf target contour and dotted shot path as secondary metaphor. Dense but disciplined developer-tool aesthetic, thin one-pixel separators, small square corners, minimal shadows, amber-orange only for current evaluation. No cream paper, no watercolor, no literal golf club or ball, no decorative landscape, no readable text, no logo, no people, no device frame, no fake UI screenshot, no gradients or glassmorphism.”

### Scorecard/evidence background

- Path: `public/promptgolf-scorecard-bg.png`
- Size: 1672×941
- Use: retained at the existing asset path; intentionally not placed behind dense score tables
- Prompt: “PromptGolf scorecard/evidence background, 16:9, coherent with a LeetCode-like dark graphite product shell. Near-black canvas with subtle technical grid. Abstract left-to-right pipeline: compact prompt/spec block, generated artifact outline, deterministic test rows, then a clean score target made from concentric technical rings and a minimal flag-pin glyph. Use restrained green for passing and under-par, amber-orange for scoring/current step, neutral gray for inactive evidence; red only as two tiny failure indicators. Flat precise vector-like illustration, small radii, crisp one-pixel dividers, lots of breathable negative space, no text or numbers, no logo, no cream paper, no watercolor, no literal golf course, no fake screenshot, no laptop/browser chrome, no people, no gradients, no glassmorphism.”

### Social share card

- Path: `public/images/promptgolf-share-card.png`
- Size: 1536×864
- Use: Open Graph and X metadata in `src/app/layout.tsx`
- Method: deterministic browser capture of the current landing page after installing the generated hero; the Next.js development badge was removed before capture

## Verification

- All three generated backgrounds were visually inspected for palette, composition, unintended text, and artifacts.
- The landing page and share card were rendered and inspected at their target dimensions.
- Focused Playwright Ctrl+Enter flow passed in provider-stub mode through live-run completion.
- Desktop and mobile checks verified the structured inline error state without page crashes or overflow.
- `npm test`: 18 files, 130 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed, 28 pages generated.
