import { describe, expect, it } from "vitest";
import { redactSecrets } from "./redact-secrets";

describe("public-boundary secret redaction", () => {
  it.each([
    ["Bearer live-token.with_parts", "Bearer [redacted]"],
    ["Basic dXNlcjpwYXNzd29yZA==", "Basic [redacted]"],
    ["OPENAI_API_KEY=provider-secret-value", "OPENAI_API_KEY=[redacted]"],
    ['{"api_key":"provider-secret-value"}', '{"api_key":"[redacted]"}'],
    ["https://service.test/fail?access_token=provider-secret-value&mode=live", "access_token=[redacted]&mode=live"],
    ["https://username:password@service.test/fail", "https://[redacted]@service.test/fail"],
    ["request failed for sk-providersecret123", "request failed for [redacted-key]"],
  ])("redacts credential form in %s", (message, expected) => {
    const sanitized = redactSecrets(message);
    expect(sanitized).toContain(expected);
    expect(sanitized).not.toContain("provider-secret");
  });

  it("redacts Moonshot key references and account identifiers from billing errors", () => {
    expect(redactSecrets("account org-exampleaccount123 <ak-examplekey123> suspended")).toBe(
      "account [redacted-account] <[redacted-key]> suspended",
    );
  });

  it("preserves useful non-secret provider context and bounds public output", () => {
    expect(redactSecrets("Moonshot returned HTTP 429: quota exceeded")).toBe("Moonshot returned HTTP 429: quota exceeded");
    expect(redactSecrets("x".repeat(20), 8)).toBe("xxxxxxxx");
  });
});