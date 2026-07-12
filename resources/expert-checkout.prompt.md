# Expert Prompt: Full-Stack Ecommerce Checkout Web App

Build a polished, framework-native full-stack ecommerce checkout application. Use Next.js with TypeScript unless the environment already specifies another supported web framework. Produce a genuine multi-file project with its package manifest, source files, install/build/start commands, a health endpoint, and a runnable preview. Do not collapse the result into a self-contained HTML file.

## Product brief

Create a responsive checkout with:

- a cart containing Canvas tote ($25.00, quantity 2, stock 3), Espresso beans ($18.00, quantity 1, stock 4), and Stoneware mug ($12.00, quantity 0, stock 0);
- accessible quantity controls and visible stock state;
- a labeled promo-code field and an Apply action;
- an order summary showing subtotal, discount, shipping, tax, and total;
- an asynchronous order-submission path with loading, error, and success states;
- a server-owned order endpoint that validates the submitted cart and returns one order confirmation;
- a health endpoint suitable for preview readiness checks.

Keep domain rules in testable modules shared by the UI and server where appropriate. Render semantic controls and observable status text so an artifact adapter and browser evaluator can discover capabilities by role, label, route, and user-visible outcome rather than source layout.

## Money and promotion rules

Represent money as integer cents at every application boundary. Never derive totals with binary floating-point dollar arithmetic.

For the current cart:

1. Subtotal is the sum of `unit price in cents × quantity`.
2. Shipping is based on the **pre-discount subtotal**: free at $50.00 or above, otherwise $7.99. `FREESHIP` also makes shipping free.
3. `SAVE10` discounts 10% of subtotal, rounded to the nearest cent.
4. `BIGSAVE` discounts the full subtotal. Cap every discount at subtotal so taxable amount and total cannot become negative.
5. Tax is 8.25% of the non-negative post-discount merchandise amount, rounded once to the nearest cent.
6. Total is non-negative taxable merchandise plus shipping plus tax.

Normalize a submitted promo with trim and case folding. Support `SAVE10`, `FREESHIP`, and `BIGSAVE`. Empty input clears the promotion without presenting an error. An unknown code clears prior promo effects and shows accessible, visible invalid-code feedback. Recalculate every dependent amount whenever quantity or promo state changes; do not retain stale discounts.

## Inventory and quantity behavior

- Quantities are integers bounded from zero through current stock.
- Disable decrement at zero and increment at stock.
- The out-of-stock mug remains visible, clearly says it is out of stock, and cannot be incremented.
- An out-of-stock line at quantity zero does not block checkout.
- Both client and server reject an empty cart, quantities above stock, and unavailable inventory with a useful visible error.
- Treat the server response as authoritative if inventory changes during submission.

## Submission behavior

On the first valid order action, synchronously enter a submitting state and disable the action. Ignore later clicks while submitting or after success. Submit to the application’s order endpoint and create at most one order for a client-generated idempotency key. The endpoint must return the same confirmation for a replay of that key rather than creating another order.

Show a visible loading status, recover to an actionable error state on failure, and show exactly one order confirmation on success. Keep the submit action disabled after success. Do not claim success before the server confirms the order.

## Positive acceptance evidence

Make these outcomes observable through ordinary user behavior and protocol responses:

- Initial subtotal is $68.00, shipping is $0.00, and the displayed arithmetic reconciles exactly.
- Increasing the tote once reaches 3 and cannot exceed its stock.
- The mug’s stock state and disabled controls are understandable without relying on color.
- Applying `  save10 ` succeeds and displays a negative $6.80 discount while shipping remains free because its threshold uses pre-discount subtotal.
- Applying `NOPE` after a valid promo removes that promo’s effect and displays invalid-code feedback.
- `BIGSAVE` never produces a negative taxable amount or total.
- Repeated order actions and repeated requests with the same idempotency key produce one confirmation.
- API validation failures and simulated request failures leave the user able to retry.
- The health route reports readiness and the production build/start commands serve the app.

Use semantic headings, landmarks, labels, buttons, status regions, and API response fields. Do not optimize for specific selectors, file paths, component names, CSS declarations, or an evaluator’s implementation.

## Product quality

Use a minimal, dense, task-focused checkout: a larger cart region and compact order summary on desktop, stacking cleanly on a 390px viewport with no horizontal overflow. Controls need visible keyboard focus and comfortable touch targets. Use restrained color, clear hierarchy, readable totals, and explicit loading/error/success copy. Avoid generic dashboard decoration, gradient text, glass effects, and oversized marketing headings.

Before finishing, install dependencies, run the production build, start the app, probe its health route, and exercise the principal checkout states. Report the real commands and any remaining limitation honestly; do not simulate successful verification.
