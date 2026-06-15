import { NextResponse, type NextRequest } from "next/server";
import { getLiveRun, subscribeToLiveRun } from "@/lib/promptgolf/live-run-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getLiveRun(id);
  if (!run) return NextResponse.json({ error: "Live run not found" }, { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: unknown) => controller.enqueue(encoder.encode(encodeEvent(payload)));
      send({ type: "snapshot", run: { ...run, prompt: undefined, artifactHtml: undefined } });
      run.events.forEach((event) => send({ type: "event", event }));

      const unsubscribe = subscribeToLiveRun(id, (event) => send({ type: "event", event }));
      const heartbeat = setInterval(() => send({ type: "heartbeat", at: new Date().toISOString() }), 15000);
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
