import { describe, expect, it } from "vitest";
import { readBoundedResponseText } from "./provider-response";

describe("bounded provider responses", () => {
  it("reads a response within the configured byte limit", async () => {
    const response = new Response("provider result", {
      headers: { "content-length": "15" },
    });

    await expect(readBoundedResponseText(response, 32)).resolves.toBe("provider result");
  });

  it("rejects an oversized declared response before buffering it", async () => {
    const response = new Response("small body", {
      headers: { "content-length": "1000" },
    });

    await expect(readBoundedResponseText(response, 32)).rejects.toThrow(/size limit/);
  });

  it("rejects an oversized chunked response while streaming", async () => {
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("é".repeat(20)));
        controller.close();
      },
    }));

    await expect(readBoundedResponseText(response, 32)).rejects.toThrow(/size limit/);
  });
});
