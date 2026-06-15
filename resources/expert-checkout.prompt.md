# Expert Prompt: Full Stack Ecommerce Checkout Web App

Build one polished, self-contained checkout HTML file with inline CSS/JS only. No Markdown or explanations. Optimize for ecommerce correctness, hidden Playwright checks, mobile usability, and accessibility.

## Seed Cart

Use exactly:

- Canvas tote: id `bag`, price `2500` cents, qty `2`, stock `3`.
- Espresso beans: id `beans`, price `1800` cents, qty `1`, stock `4`.
- Stoneware mug: id `mug`, price `1200` cents, qty `0`, stock `0`, visibly `Out of stock`.

## UI/Test Contract

Show: `Cart items`, `Order summary`, `Canvas tote`, `Espresso beans`, `Stoneware mug`, `Out of stock`, `SAVE10`, `FREESHIP`, `BIGSAVE`, and `Promo code`.

Add these `data-testid`s to real visible elements: `subtotal`, `discount`, `shipping`, `tax`, `total`, `promo-input`, `apply-promo`, `checkout`, `confirmation`, `qty-bag`, `qty-beans`, `qty-mug`, `item-mug`.

Use real buttons with accessible labels: `Increase/Decrease Canvas tote`, `Increase/Decrease Espresso beans`, and `Increase/Decrease Stoneware mug`. The promo input needs a visible associated `Promo code` label.

## Business Rules

- Store money in integer cents; display US dollars with two decimals.
- Subtotal = `priceCents * qty`; discount displays negative and never exceeds subtotal.
- Tax = `Math.round(max(0, subtotal - discount) * 0.0825)`.
- Total = `max(0, subtotal - discount) + shipping + tax`; never negative, and displayed rows must add up exactly.
- Shipping is `799` cents, free when pre-discount subtotal is at least `5000`, or when `FREESHIP` is applied.
- Promo codes are `trim()`med and case-insensitive: `SAVE10` = 10% subtotal discount, `FREESHIP` = free shipping, `BIGSAVE` = subtotal-sized discount. Invalid codes like `NOPE` clear prior promo effects and show `Invalid promo code`, `not valid`, or `unknown`.

## Stock And Checkout

- Quantities update in `qty-bag`, `qty-beans`, and `qty-mug`.
- Quantity cannot go below `0` or above stock; disable decrement at `0`, increment at stock, and all mug controls because stock is `0`.
- Block checkout with a clear message if the cart is empty, over stock, or includes an out-of-stock selected item.
- On checkout, immediately set a submitting/loading state, disable checkout, ignore repeated clicks, then show one success/confirmed/order message in `confirmation`. Keep checkout disabled after success.

## Accessibility And Mobile

Use semantic HTML, labels, buttons, `role="status"` or `aria-live="polite"`, and touch targets at least `40px` high. At `390px` width, stack cleanly with no horizontal scrolling. Make it feel like a finished checkout with clear hierarchy, readable totals, and visible error/success states.
