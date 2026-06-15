import { NextResponse } from "next/server";
import { getChallenge } from "@/lib/promptgolf";

const AGNES_IMAGE_API = "https://apihub.agnes-ai.com/v1/images/generations";

const STYLE_DIRECTION = `Style design direction:

- Use an Editorial Luxury plus Soft Structuralism blend: warm ivory or soft silver background, deep espresso/ink text, restrained sage/green success, refined amber warning, and one confident dark CTA.
- Use a high-end type stack such as Plus Jakarta Sans, Geist, Avenir Next, ui-sans-serif, system-ui; do not use Inter, Roboto, Arial, Open Sans, or Helvetica in the CSS font-family.
- Use an asymmetrical two-column layout on desktop: cart content larger on the left, order summary in a tactile card on the right.
- Use a single-column layout below 768px.
- Use a double-bezel card structure: a subtle outer shell and an inner white/ivory core for the checkout surface and order summary.
- Use refined spacing, clear section headings, visible hierarchy, and compact line items.
- Use pill-shaped primary CTA and promo controls with polished hover/active states.
- Use custom cubic-bezier transitions such as cubic-bezier(.32,.72,0,1) for color, transform, and opacity only.
- Do not use decorative glassmorphism, gradient text, generic gray Bootstrap cards, huge dark drop shadows, or noisy icon sets.
- Make focus states visible.

Mobile requirements:

- At 390px width, there must be no horizontal scrolling.
- Controls must stack cleanly.
- Buttons and inputs must be at least 40px high.
- Quantity buttons should be easy to tap.

Accessibility requirements:

- Use semantic <main>, <section>, headings, labels, and buttons.
- Use aria-live="polite" or role="status" for promo and confirmation messages.
- Do not rely on color alone for errors or stock status.`;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const apiKey = process.env.AGNES_AI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "AGNES image generation is not configured" }, { status: 503 });
  }

  const requirements = [challenge.publicBrief, ...challenge.publicRequirements].join(" ");

  const imagePrompt = `${requirements} ${STYLE_DIRECTION} White background, no text in the image, no letters.`;

  const res = await fetch(AGNES_IMAGE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "agnes-image-2.0-flash",
      prompt: imagePrompt,
      size: "1024x768",
      extra_body: { response_format: "url" },
    }),
  });

  let images: string[] = [];
  if (res.ok) {
    const data = await res.json();
    const url = data?.data?.[0]?.url;
    if (url) images = [url];
  }

  return NextResponse.json({ images });
}
