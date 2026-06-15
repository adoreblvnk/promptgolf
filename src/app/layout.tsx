import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined)
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const shareImage = {
  url: "/images/promptgolf-share-card.png",
  width: 1536,
  height: 864,
  alt: "PromptGolf scorecard preview showing hidden ecommerce checkout tests.",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PromptGolf - LeetCode for agentic prompting",
  description: "Competitive benchmark for agentic prompting: fewer prompts, more passing tests.",
  openGraph: {
    title: "PromptGolf - LeetCode for agentic prompting",
    description: "Competitive benchmark for agentic prompting: fewer prompts, more passing tests.",
    url: "/",
    siteName: "PromptGolf",
    images: [shareImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptGolf - LeetCode for agentic prompting",
    description: "Competitive benchmark for agentic prompting: fewer prompts, more passing tests.",
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ec",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
