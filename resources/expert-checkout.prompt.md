# Expert Prompt: Full Stack Ecommerce Checkout Web App

Build a single self-contained `index.html` checkout app. Return only complete HTML with inline CSS and inline JavaScript. No Markdown, no explanations, no external libraries, no imports, no build tools, no placeholder code.

Priorities in order:

1. Pass the functional and hidden browser checks exactly.
2. Keep the implementation simple enough to avoid code-generation mistakes.
3. Make the UI look like a premium, finished consumer checkout.

## Non-Negotiable Implementation Shape

Use plain HTML, CSS, and JavaScript in one file.

Use this exact state shape in JavaScript:

```js
const items = [
  { id: "bag", name: "Canvas tote", priceCents: 2500, qty: 2, stock: 3 },
  { id: "beans", name: "Espresso beans", priceCents: 1800, qty: 1, stock: 4 },
  { id: "mug", name: "Stoneware mug", priceCents: 1200, qty: 0, stock: 0 }
];
let appliedPromo = null;
let submitting = false;
let submitted = false;
```

Implement one `render()` function that recalculates all totals and rewrites the visible quantities, totals, messages, and disabled states after every user action. Do not rely on stale values.

## Required Visible Text

The page must visibly contain these exact strings somewhere in the rendered UI:

- `Cart items`
- `Order summary`
- `Canvas tote`
- `Espresso beans`
- `Stoneware mug`
- `Out of stock`
- `SAVE10`
- `FREESHIP`
- `BIGSAVE`
- `Promo code`

## Required DOM Contract

Add these attributes to real visible elements. Do not put them on hidden wrappers.

- Subtotal amount: `data-testid="subtotal"`
- Discount amount: `data-testid="discount"`
- Shipping amount: `data-testid="shipping"`
- Tax amount: `data-testid="tax"`
- Total amount: `data-testid="total"`
- Promo field: `data-testid="promo-input"`
- Apply button: `data-testid="apply-promo"`
- Checkout button: `data-testid="checkout"`
- Confirmation/status area: `data-testid="confirmation"`
- Canvas tote quantity text: `data-testid="qty-bag"`
- Espresso beans quantity text: `data-testid="qty-beans"`
- Stoneware mug quantity text: `data-testid="qty-mug"`
- Stoneware mug item/card row: `data-testid="item-mug"`

The promo field must also have a real visible `<label for="promo">Promo code</label>`.

Use real `<button>` elements with these exact accessible names via `aria-label`:

- `Increase Canvas tote`
- `Decrease Canvas tote`
- `Increase Espresso beans`
- `Decrease Espresso beans`
- `Increase Stoneware mug`
- `Decrease Stoneware mug`

Use a real checkout button whose visible text or accessible name includes `Place order`, `Checkout`, or `Confirm order`.

## Exact Money Rules

All money math must use integer cents only. Never use floats for internal money calculations.

Use this formatter:

```js
function dollars(cents) {
  const sign = cents < 0 ? "-" : "";
  return sign + "$" + (Math.abs(cents) / 100).toFixed(2);
}
```

Calculations:

- `subtotal = sum(item.priceCents * item.qty)`.
- Shipping is based on pre-discount subtotal.
- `shipping = subtotal >= 5000 || appliedPromo === "FREESHIP" ? 0 : 799`.
- `discountPositive = 0` by default.
- If `SAVE10`, `discountPositive = Math.round(subtotal * 0.10)`.
- If `BIGSAVE`, `discountPositive = subtotal`.
- Cap discount: `discountPositive = Math.min(discountPositive, subtotal)`.
- Taxable amount: `taxable = Math.max(0, subtotal - discountPositive)`.
- `tax = Math.round(taxable * 0.0825)`.
- `total = Math.max(0, taxable + shipping + tax)`.

Display rows:

- Subtotal displays `dollars(subtotal)`.
- Discount displays `dollars(-discountPositive)`, including `-$0.00` or `$0.00` is acceptable when no promo is active, but after `SAVE10` it must be negative.
- Shipping displays `dollars(shipping)`.
- Tax displays `dollars(tax)`.
- Total displays `dollars(total)`.

Important: on the initial page load, with default quantities and no promo, the displayed `subtotal + shipping + tax` must equal the displayed `total` exactly.

## Promo Rules

Promo input handling must be deterministic:

```js
const code = promoInput.value.trim().toUpperCase();
```

Supported codes:

- `SAVE10`: apply 10% off subtotal and show a success/help message.
- `FREESHIP`: set shipping to zero and show a success/help message.
- `BIGSAVE`: discount the full subtotal but never make total negative.

Invalid codes:

- If code is empty, clear promo effects and show a neutral message.
- If code is unknown, set `appliedPromo = null`, clear all promo effects, and show a visible message containing one of these words: `Invalid`, `not valid`, or `unknown`.
- Invalid code `NOPE` must visibly produce invalid-code feedback after clicking Apply.

## Quantity And Stock Rules

- Quantity text must update inside `qty-bag`, `qty-beans`, and `qty-mug`.
- Quantity can never go below `0`.
- Quantity can never go above `stock`.
- Canvas tote starts at qty `2`, stock `3`; after one click on `Increase Canvas tote`, it must show qty `3`, never `4` or more.
- Disable decrement buttons when qty is `0`.
- Disable increment buttons when qty is at stock.
- Stoneware mug has stock `0`, qty `0`, and must visibly show `Out of stock` or `stock 0` inside the `item-mug` element.
- Both `Increase Stoneware mug` and `Decrease Stoneware mug` must be disabled from the start.

## Checkout Rules

Checkout must be robust against double clicks:

- On first checkout click, immediately set `submitting = true`.
- Immediately disable the checkout button.
- Immediately change the button text to `Submitting...` or show visible `loading` / `submitting` text.
- Ignore any later checkout clicks while `submitting` or `submitted` is true.
- Use `setTimeout` around 300-600ms, then set `submitted = true`, `submitting = false`.
- Show exactly one success message in the `confirmation` element containing `Order confirmed`, `success`, or `order`.
- Keep the checkout button disabled after success.

Do not block checkout just because the Stoneware mug is out of stock if its quantity is `0`. Only block if the cart is empty, an item qty is above stock, or an out-of-stock item has qty above `0`.

## Premium UI / UX Requirements

Create a premium checkout, not a generic form.

Design direction:

- Use an Editorial Luxury plus Soft Structuralism blend: warm ivory or soft silver background, deep espresso/ink text, restrained sage/green success, refined amber warning, and one confident dark CTA.
- Use a high-end type stack such as `Plus Jakarta Sans`, `Geist`, `Avenir Next`, `ui-sans-serif`, `system-ui`; do not use Inter, Roboto, Arial, Open Sans, or Helvetica in the CSS font-family.
- Use an asymmetrical two-column layout on desktop: cart content larger on the left, order summary in a tactile card on the right.
- Use a single-column layout below `768px`.
- Use a double-bezel card structure: a subtle outer shell and an inner white/ivory core for the checkout surface and order summary.
- Use refined spacing, clear section headings, visible hierarchy, and compact line items.
- Use pill-shaped primary CTA and promo controls with polished hover/active states.
- Use custom cubic-bezier transitions such as `cubic-bezier(.32,.72,0,1)` for color, transform, and opacity only.
- Do not use decorative glassmorphism, gradient text, generic gray Bootstrap cards, huge dark drop shadows, or noisy icon sets.
- Make focus states visible.

Mobile requirements:

- At `390px` width, there must be no horizontal scrolling.
- Controls must stack cleanly.
- Buttons and inputs must be at least `40px` high.
- Quantity buttons should be easy to tap.

Accessibility requirements:

- Use semantic `<main>`, `<section>`, headings, labels, and buttons.
- Use `aria-live="polite"` or `role="status"` for promo and confirmation messages.
- Do not rely on color alone for errors or stock status.

## Final Self-Check Before Returning HTML

Before returning the final HTML, mentally verify:

- `getByText(/cart items|order summary/i)` can find visible text.
- Promo input can be found by label `Promo code` or `data-testid="promo-input"`.
- Apply button can be found by text/name `Apply`, `Redeem`, `Promo`, or `Coupon`.
- Checkout button can be found by text/name `Checkout`, `Confirm`, `Place order`, or `Order`.
- Invalid `NOPE` shows invalid feedback.
- Clicking `Increase Canvas tote` once leaves qty `<= 3`.
- Stoneware mug row contains `Out of stock` and both mug buttons are disabled.
- Double-clicking checkout results in one confirmation and a disabled checkout button.
- Initial `subtotal + shipping + tax === total`.
- Applying `  save10 ` makes discount display as a negative dollar value.
- Applying `SAVE10` still leaves shipping at `$0.00` because pre-discount subtotal is at least `$50.00`.
- Desktop and mobile screenshots look like a finished premium checkout.
