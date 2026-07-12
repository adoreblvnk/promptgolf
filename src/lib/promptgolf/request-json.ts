export const MAX_API_JSON_BYTES = 64 * 1024;

export type JsonBodyResult =
  | { success: true; data: unknown }
  | { success: false; status: 400 | 413; message: string };

/** Reads a JSON request incrementally so public API routes never buffer an unbounded body. */
export async function readBoundedJson(request: Request, maxBytes = MAX_API_JSON_BYTES): Promise<JsonBodyResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) {
      return { success: false, status: 413, message: `Request body cannot exceed ${maxBytes} bytes.` };
    }
  }

  if (!request.body) return { success: false, status: 400, message: "Request body must contain valid JSON." };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("request body exceeded limit").catch(() => undefined);
        return { success: false, status: 413, message: `Request body cannot exceed ${maxBytes} bytes.` };
      }
      chunks.push(value);
    }
  } catch {
    return { success: false, status: 400, message: "Request body could not be read." };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { success: true, data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { success: false, status: 400, message: "Request body must contain valid UTF-8 JSON." };
  }
}
