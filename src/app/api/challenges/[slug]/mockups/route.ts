import { NextResponse } from "next/server";
import { getChallenge } from "@/lib/promptgolf";

const AGNES_IMAGE_API = "https://apihub.agnes-ai.com/v1/images/generations";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const apiKey = process.env.AGNES_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "AGNES image generation is not configured" }, { status: 503 });
  }

  const groups = [
    challenge.hiddenTeasers.slice(0, 3),
    challenge.hiddenTeasers.slice(3, 7),
    challenge.hiddenTeasers.slice(7, 10),
  ];

  const imagePrompts = groups.map(
    (group) => `${challenge.publicBrief} ${group.join(", ")}. white background, no text in the image, no letters.`
  );

  const results = await Promise.allSettled(
    imagePrompts.map(async (prompt) => {
      const res = await fetch(AGNES_IMAGE_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "agnes-image-2.0-flash",
          prompt,
          size: "1024x768",
          extra_body: { response_format: "url" },
        }),
      });
      if (!res.ok) {
        throw new Error(`AGNES API returned ${res.status}`);
      }
      const data = await res.json();
      return data?.data?.[0]?.url ?? null;
    })
  );

  const images = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((url): url is string => url !== null);

  return NextResponse.json({ images });
}
