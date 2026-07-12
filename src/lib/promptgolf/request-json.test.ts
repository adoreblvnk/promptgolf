import { describe, expect, it } from "vitest";
import { readBoundedJson } from "./request-json";

describe("bounded API JSON reader", () => {
  it("parses a valid body", async () => {
    const result = await readBoundedJson(new Request("https://promptgolf.test/api", {
      method: "POST",
      body: JSON.stringify({ prompt: "build it" }),
      headers: { "content-type": "application/json" },
    }));
    expect(result).toEqual({ success: true, data: { prompt: "build it" } });
  });

  it("rejects an oversized declared body before reading it", async () => {
    const result = await readBoundedJson(new Request("https://promptgolf.test/api", {
      method: "POST",
      body: "{}",
      headers: { "content-length": "100" },
    }), 10);
    expect(result).toMatchObject({ success: false, status: 413 });
  });

  it("enforces the actual streamed byte count when length is absent", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":"'));
        controller.enqueue(new TextEncoder().encode('too long"}'));
        controller.close();
      },
    });
    const result = await readBoundedJson(new Request("https://promptgolf.test/api", {
      method: "POST",
      body: stream,
      // Required by Node's Request implementation for a streaming request body.
      duplex: "half",
    } as RequestInit & { duplex: "half" }), 12);
    expect(result).toMatchObject({ success: false, status: 413 });
  });

  it("rejects malformed and invalid UTF-8 JSON", async () => {
    const malformed = await readBoundedJson(new Request("https://promptgolf.test/api", { method: "POST", body: "{" }));
    const invalidUtf8 = await readBoundedJson(new Request("https://promptgolf.test/api", {
      method: "POST",
      body: new Uint8Array([0xff]),
    }));
    expect(malformed).toMatchObject({ success: false, status: 400 });
    expect(invalidUtf8).toMatchObject({ success: false, status: 400 });
  });
});