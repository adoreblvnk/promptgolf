import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkoutEvaluatorSpecs } from "./evaluator-specs";
import { evaluateSpecsWithPlaywright, moneyToCents } from "./playwright-evaluator";

describe("moneyToCents", () => {
  it.each([
    ["$19.99", 1999],
    ["USD 1,234.50", 123450],
    ["-$4.5", -450],
    ["($12.34)", -1234],
    ["Total: 8", 800],
  ])("parses a single observable monetary amount from %j", (input, expected) => {
    expect(moneyToCents(input)).toBe(expected);
  });

  it.each(["", "free", "$1.999", "Subtotal $10.00 Total $12.00", "1e309"])(
    "rejects ambiguous or malformed evidence %j instead of accidentally passing it",
    (input) => expect(() => moneyToCents(input)).toThrow(/monetary amount|one monetary/),
  );
});

describe("semantic evaluator controls", () => {
  let server: Server;
  let url = "";

  beforeAll(async () => {
    server = createServer((request, response) => {
      response.setHeader("content-type", "text/html");
      if (request.url === "/checkout") {
        response.end(`<!doctype html><main><section aria-label="Cart items"><article aria-label="Canvas tote"><h2>Canvas tote</h2><p>$25.00 each · Stock 3</p><button aria-label="Decrease quantity for Canvas tote">−</button><input type="number" aria-label="Quantity 0 to 3" value="2"><button aria-label="Increase quantity for Canvas tote">+</button></article><article aria-label="Stoneware mug"><h2>Stoneware mug</h2><p>$12.00 each · Stock 0 · Out of stock</p><button aria-label="Decrease quantity for Stoneware mug" disabled>−</button><input aria-label="Quantity Out of stock" value="0" disabled><button aria-label="Increase quantity for Stoneware mug" disabled>+</button></article></section><aside aria-label="Order summary"><p>Subtotal <strong>$68.00</strong></p><p>Shipping <strong>$0.00</strong></p><p>Tax (8%) <strong>$5.44</strong></p><p>Total <strong>$73.44</strong></p></aside></main>`);
        return;
      }
      response.end(`<!doctype html><section aria-labelledby="promo-heading"><h2 id="promo-heading">Promo code</h2><label for="promo-code">Code</label><input id="promo-code"><button>Apply</button><p role="status"></p></section><script>setTimeout(()=>document.querySelector('button').addEventListener('click',()=>document.querySelector('[role=status]').textContent='Invalid promo code'),100)</script>`);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port.");
    url = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  it("targets the labeled textbox rather than its named region after hydration", async () => {
    const [result] = await evaluateSpecsWithPlaywright({
      url,
      specs: [{
        id: "promo",
        label: "Promo",
        category: "functional",
        intent: "Invalid promo feedback is observable.",
        actions: [
          { kind: "fill", testId: "promoCode", value: "NOPE" },
          { kind: "click", target: { by: "testId", value: "applyPromo" } },
        ],
        assertions: [{ kind: "textMatches", target: { by: "text", pattern: "invalid" }, pattern: "invalid" }],
      }],
    });
    expect(result).toMatchObject({ passed: true });
  });

  it("accepts descriptive quantity labels and visibly disabled out-of-stock controls", async () => {
    const specs = checkoutEvaluatorSpecs.filter((spec) => ["quantity-boundaries", "out-of-stock"].includes(spec.id));

    const results = await evaluateSpecsWithPlaywright({ url: `${url}/checkout`, specs });

    expect(results).toEqual([
      expect.objectContaining({ id: "quantity-boundaries", passed: true }),
      expect.objectContaining({ id: "out-of-stock", passed: true }),
    ]);
  }, 15_000);

  it("ignores a displayed tax percentage when reading the tax amount", async () => {
    const cents = checkoutEvaluatorSpecs.filter((spec) => spec.id === "cents");

    const [result] = await evaluateSpecsWithPlaywright({ url: `${url}/checkout`, specs: cents });

    expect(result).toMatchObject({ id: "cents", passed: true });
  }, 15_000);
});
