import type { LiveRunTestResult } from "./live-run-store";

export type EvaluatorAction =
  | { kind: "waitForText"; pattern: string }
  | { kind: "waitForTestId"; testId: string }
  | { kind: "fill"; testId: string; value: string }
  | { kind: "click"; target: EvaluatorTarget }
  | { kind: "clickTwice"; testId: string }
  | { kind: "setViewport"; width: number; height: number }
  | { kind: "optionalWaitForText"; pattern: string; timeoutMs: number };

export type EvaluatorAssertion =
  | { kind: "moneySumEquals"; addends: string[]; expected: string }
  | { kind: "moneyLessThan"; testId: string; cents: number }
  | { kind: "moneyAtLeast"; testId: string; cents: number }
  | { kind: "moneyEquals"; testId: string; cents: number }
  | { kind: "textMatches"; target: EvaluatorTarget; pattern: string }
  | { kind: "numberAtMost"; testId: string; max: number }
  | { kind: "isDisabled"; target: EvaluatorTarget }
  | { kind: "touchTargetMinHeight"; testId: string; minPx: number };

export type EvaluatorTarget =
  | { by: "testId"; value: string }
  | { by: "label"; pattern: string }
  | { by: "text"; pattern: string }
  | { by: "testIdText"; testId: string; pattern: string };

export type NaturalLanguageEvaluatorSpec = Omit<LiveRunTestResult, "passed" | "note"> & {
  intent: string;
  contract?: string[];
  actions: EvaluatorAction[];
  assertions: EvaluatorAssertion[];
};

export const CHECKOUT_REQUIRED_CONTRACT_MARKERS = ["Cart items", "Order summary", "Canvas tote", "Espresso beans", "Stoneware mug", "Out of stock", "SAVE10", "FREESHIP", "BIGSAVE", "Increase Canvas tote", "Increase Stoneware mug", "Promo code"];

export const checkoutEvaluatorSpecs: NaturalLanguageEvaluatorSpec[] = [
  {
    id: "public-cart",
    label: "Cart, quantities, totals, promo, confirmation render",
    category: "public",
    intent: "The generated checkout exposes the public cart, order-summary, promo, and checkout controls a user needs to complete the visible brief.",
    actions: [{ kind: "waitForText", pattern: "cart items|order summary" }],
    assertions: [
      { kind: "textMatches", target: { by: "testId", value: "promoCode" }, pattern: ".*" },
      { kind: "textMatches", target: { by: "testId", value: "checkout" }, pattern: ".*" },
    ],
  },
  {
    id: "cents",
    label: "Integer cents math",
    category: "hidden",
    intent: "Totals are internally consistent and avoid floating-point drift for subtotal, shipping, tax, and total.",
    actions: [],
    assertions: [{ kind: "moneySumEquals", addends: ["subtotal", "shipping", "tax"], expected: "total" }],
  },
  {
    id: "promo-normalize",
    label: "Promo trim/case-insensitive matching",
    category: "hidden",
    intent: "Promo codes are normalized by trimming whitespace and matching case-insensitively.",
    actions: [
      { kind: "fill", testId: "promoCode", value: "  save10 " },
      { kind: "click", target: { by: "testId", value: "applyPromo" } },
    ],
    assertions: [{ kind: "moneyLessThan", testId: "discount", cents: 0 }],
  },
  {
    id: "invalid-code",
    label: "Invalid promo error",
    category: "hidden",
    intent: "Invalid promo codes produce clear, recoverable feedback instead of silently failing.",
    actions: [
      { kind: "fill", testId: "promoCode", value: "NOPE" },
      { kind: "click", target: { by: "testId", value: "applyPromo" } },
    ],
    assertions: [{ kind: "textMatches", target: { by: "text", pattern: "invalid|not valid|unknown" }, pattern: "invalid|not valid|unknown" }],
  },
  {
    id: "discount-floor",
    label: "Discount floor prevents negative totals",
    category: "hidden",
    intent: "Large discounts are capped so the payable total never becomes negative.",
    actions: [
      { kind: "fill", testId: "promoCode", value: "BIGSAVE" },
      { kind: "click", target: { by: "testId", value: "applyPromo" } },
    ],
    assertions: [{ kind: "moneyAtLeast", testId: "total", cents: 0 }],
  },
  {
    id: "shipping-threshold",
    label: "Shipping threshold uses pre-discount subtotal",
    category: "hidden",
    intent: "Free shipping is computed from the intended pre-discount subtotal threshold.",
    actions: [
      { kind: "fill", testId: "promoCode", value: "SAVE10" },
      { kind: "click", target: { by: "testId", value: "applyPromo" } },
    ],
    assertions: [{ kind: "moneyEquals", testId: "shipping", cents: 0 }],
  },
  {
    id: "quantity-boundaries",
    label: "Stock and quantity boundaries",
    category: "hidden",
    intent: "Quantity controls enforce stock limits and do not let out-of-stock zero-quantity items decrement below zero.",
    actions: [{ kind: "click", target: { by: "label", pattern: "increase canvas tote" } }],
    assertions: [
      { kind: "numberAtMost", testId: "qtyCanvas", max: 3 },
      { kind: "isDisabled", target: { by: "label", pattern: "decrease stoneware mug" } },
    ],
  },
  {
    id: "out-of-stock",
    label: "Out-of-stock handling",
    category: "hidden",
    intent: "Out-of-stock items are visibly labeled and cannot be added to the cart.",
    actions: [],
    assertions: [
      { kind: "textMatches", target: { by: "testIdText", testId: "itemMug", pattern: "out of stock|stock 0" }, pattern: "out of stock|stock 0" },
      { kind: "isDisabled", target: { by: "label", pattern: "increase stoneware mug" } },
    ],
  },
  {
    id: "double-submit",
    label: "Double-submit prevention and loading state",
    category: "hidden",
    intent: "Checkout submission locks while pending and repeated clicks cannot create duplicate orders.",
    actions: [
      { kind: "clickTwice", testId: "checkout" },
      { kind: "optionalWaitForText", pattern: "submitting|loading", timeoutMs: 1000 },
    ],
    assertions: [
      { kind: "textMatches", target: { by: "testId", value: "confirmation" }, pattern: "confirmed|success|order" },
      { kind: "isDisabled", target: { by: "testId", value: "checkout" } },
    ],
  },
  {
    id: "mobile-a11y",
    label: "Mobile usability and accessibility basics",
    category: "hidden",
    intent: "Core checkout controls remain accessible and large enough to use on a small mobile viewport.",
    actions: [{ kind: "setViewport", width: 390, height: 760 }],
    assertions: [
      { kind: "textMatches", target: { by: "label", pattern: "promo code" }, pattern: ".*" },
      { kind: "touchTargetMinHeight", testId: "checkout", minPx: 40 },
    ],
  },
];
