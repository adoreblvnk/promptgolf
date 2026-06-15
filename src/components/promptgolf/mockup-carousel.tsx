"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "./chrome";

export function MockupCarousel({ challengeSlug }: { challengeSlug: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/challenges/${challengeSlug}/mockups`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images?.[0]) {
          setImageUrl(data.images[0]);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [challengeSlug]);

  return (
    <GlassCard>
      <div className="flex items-center gap-2.5">
        <svg className="size-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Mockup</h3>
      </div>

      {loading && (
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-md border border-rule bg-paper">
          <span className="font-mono text-xs text-ink-muted">Generating mockup…</span>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-md border border-rule bg-paper">
          <span className="font-mono text-xs text-ink-muted">Mockup unavailable</span>
        </div>
      )}

      {!loading && !error && imageUrl && (
        <div className="mt-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-rule bg-paper">
            <Image
              src={imageUrl}
              alt="Checkout mockup"
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
