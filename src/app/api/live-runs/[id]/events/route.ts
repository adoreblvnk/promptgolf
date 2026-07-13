import { NextResponse, type NextRequest } from "next/server";
import { getLiveRun, LiveRunSubscriberLimitError, subscribeToLiveRun } from "@/lib/promptgolf/live-run-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run) return NextResponse.json({ error: "Live run not found" }, { status: 404 });

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  let closed = false;
  let unsubscribe: () => void = () => undefined;
  const timers: { heartbeat?: ReturnType<typeof setInterval> } = {};

  const close = () => {
    if (closed) return;
    closed = true;
    if (timers.heartbeat) clearInterval(timers.heartbeat);
    unsubscribe();
    void writer.close().catch(() => undefined);
  };
  const send = (payload: unknown) => {
    if (closed) return Promise.resolve();
    return writer.write(encoder.encode(encodeEvent(payload))).catch(close);
  };

  try {
    unsubscribe = subscribeToLiveRun(id, (event) => {
      void send({ type: "event", event }).finally(() => {
        if (event.stage === "completed" || event.stage === "failed") close();
      });
    });
  } catch (error) {
    if (error instanceof LiveRunSubscriberLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "15" } });
    }
    throw error;
  }

  timers.heartbeat = setInterval(() => send({ type: "heartbeat", at: new Date().toISOString() }), 15000);
  request.signal.addEventListener("abort", close, { once: true });
  void send({ type: "snapshot", run: { ...run, prompt: undefined, artifactWorkspace: undefined, upstreamPreviewUrl: undefined } }).finally(() => {
    if (run.status === "completed" || run.status === "failed") close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
