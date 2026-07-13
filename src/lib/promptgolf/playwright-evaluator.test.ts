import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
    server = createServer((_request, response) => {
      response.setHeader("content-type", "text/html");
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
});
