"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "./chrome";

export function MockupCarousel({ challengeSlug }: { challengeSlug: string }) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/challenges/${challengeSlug}/mockups`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images?.length) {
          setImageUrls(data.images);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [challengeSlug]);

  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(imageUrls.length - 1, i + 1));

  return (
    <GlassCard>
      <div className="flex items-center gap-2.5">
        <svg className="size-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Mockups</h3>
      </div>

      {loading && (
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-md border border-rule bg-paper">
          <span className="font-mono text-xs text-ink-muted">Generating mockups…</span>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-md border border-rule bg-paper">
          <span className="font-mono text-xs text-ink-muted">Mockups unavailable</span>
        </div>
      )}

      {!loading && !error && imageUrls.length > 0 && (
        <div className="mt-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-rule bg-paper">
            <Image
              src={imageUrls[currentIndex]}
              alt={`Mockup ${currentIndex + 1} of ${imageUrls.length}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 100vw"
              unoptimized
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="inline-flex size-8 items-center justify-center rounded-md border border-rule bg-paper text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous mockup"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-mono text-xs text-ink-muted">
              {currentIndex + 1} / {imageUrls.length}
            </span>
            <button
              onClick={next}
              disabled={currentIndex === imageUrls.length - 1}
              className="inline-flex size-8 items-center justify-center rounded-md border border-rule bg-paper text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next mockup"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
