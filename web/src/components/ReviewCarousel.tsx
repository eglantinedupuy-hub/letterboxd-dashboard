"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Stars } from "./Stars";
import { posterUrl } from "@/lib/poster";
import type { Review } from "@/lib/data";

type Props = { reviews: (Review & { poster?: string | null })[]; startIndex: number; intervalMs?: number };

/** Rotates through my old diary reviews, one at a time. Pauses while hovered. */
export function ReviewCarousel({ reviews, startIndex, intervalMs = 20000 }: Props) {
  const [i, setI] = useState(startIndex % Math.max(reviews.length, 1));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reviews.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % reviews.length), intervalMs);
    return () => clearInterval(id);
  }, [paused, reviews.length, intervalMs]);

  if (!reviews.length) return null;
  const r = reviews[i];
  const random = () => setI((x) => (x + 1 + Math.floor(Math.random() * (reviews.length - 1))) % reviews.length);

  return (
    <div
      className="rounded-2xl bg-card p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={i} className="flex animate-[fade_400ms_ease-out] gap-5">
        {posterUrl(r.poster, "w154") && (
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Image src={posterUrl(r.poster, "w154")!} alt={`Poster for ${r.name}`} width={80} height={120} unoptimized className="h-[120px] w-[80px] rounded-lg object-cover" />
          </a>
        )}
        <div className="min-w-0">
        <p className="text-lg leading-relaxed whitespace-pre-line sm:text-xl">“{r.text}”</p>
        <p className="mt-4 text-sm">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-link">
            {r.name}
          </a>
          <span className="text-muted"> ({r.year}) · {r.date}</span>
          <Stars rating={r.rating} className="ml-2" />
        </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={random} className="rounded-full bg-card-hover px-4 py-1.5 text-sm transition hover:bg-white hover:text-black">
          Another one ↻
        </button>
        <span className="text-xs text-muted">{reviews.length} entries in the jar</span>
      </div>
    </div>
  );
}
