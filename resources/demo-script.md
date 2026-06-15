# PromptGolf 2-Minute Demo Script

## 0:00–0:12 — Hook

“Everyone’s trying to benchmark models.

But after seeing your prompts, I realized: **your models don’t have a skill issue. You do.**

Start promptmaxxing instead.

This is PromptGolf: LeetCode for AI prompts.”

## 0:12–0:25 — What it is

“PromptGolf benchmarks the spec writer, not the model.

Good prompts are not magic words. They’re prompt structure plus actual technical knowledge.

The game is simple: fewer prompts, more hidden tests passed, higher score.”

## 0:25–0:42 — Show challenge

“Here’s the demo challenge: Mini Checkout + Promo Code Engine.

The public brief is simple: build checkout with cart items, quantities, promo codes and order confirmation.

Sounds easy. Which is exactly how people ship bugs.”

## 0:42–1:02 — Vague prompt run

“First, I paste the vague version:

‘Build a checkout page with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation.’

That’s one prompt. No edge cases. No product rules. No checkout knowledge.

Now the pipeline runs: Kimi builds the app, Daytona serves it live in a sandbox, and TokenRouter routes evaluator/model calls”

## 1:02–1:24 — Naive result

“Visually, it looks done.

Cart renders. Checkout works on the happy path.

But hidden tests tear it apart.

It fails promo normalization, stock handling, quantity bounds, double-submit prevention, and mobile/accessibility checks.

The app passed the screenshot test. It failed reality.”

## 1:24–1:42 — Expert spec run

“Now I paste the expert `.prompt.md`-style spec.

Same challenge. Same model. Same pipeline.

But now the prompt includes structure and domain knowledge:.”

## 1:42–1:56 — Expert result

“Kimi builds again. Daytona serves again. TokenRouter supports the evaluator path again

Now the score jumps.

Not because the model got smarter. Because the spec stopped being unserious.”

## 1:56–2:00 — Close

“Same model. Same task. Better spec.

**Your models don’t have a skill issue. You do.**”
