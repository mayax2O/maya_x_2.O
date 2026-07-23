"use client";

import { useEffect, useState } from "react";

import type { HeroMediaItem } from "../../lib/types";
import { AlponaMotif } from "../motifs/AlponaMotif";
import { SearchBar } from "../search/SearchBar";
import { Container } from "../layout/Container";

const SLIDER_INTERVAL_MS = 6000;

// Section: Hero — deliberately fixed dark in every theme (a bookend accent
// against the surrounding light content), so it uses literal hex values
// instead of the theme-aware ink/porcelain tokens. Admin controls the
// background media (Admin → Hero): a single image, a single autoplay/muted
// video, or an auto-rotating slider of images. No media configured falls
// back to the original gradient-only look.
export function Hero({
  mode = "image",
  media = [],
}: {
  mode?: "image" | "video" | "slider";
  media?: HeroMediaItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (mode !== "slider" || media.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % media.length);
    }, SLIDER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mode, media.length]);

  const hasMedia = media.length > 0;

  return (
    <section className="relative overflow-hidden bg-[#12141c] text-[#f3f4f6]">
      {hasMedia ? (
        <div className="absolute inset-0" aria-hidden="true">
          {mode === "video" ? (
            <video
              key={media[0]?.id}
              src={media[0]?.url}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : mode === "slider" ? (
            media.map((item, index) => (
              <img
                key={item.id}
                src={item.url}
                alt={item.altText ?? ""}
                className={[
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
                  index === activeIndex ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            ))
          ) : (
            <img
              src={media[0]?.url}
              alt={media[0]?.altText ?? ""}
              className="h-full w-full object-cover"
            />
          )}
          {/* Scrim so heading/body text stays legible over the media. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-[#12141c]/70 to-[#12141c]/30" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#12141c] via-[#1c1f29] to-brass-deep/30"
          aria-hidden="true"
        />
      )}
      <Container className="relative flex flex-col gap-8 py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-tint/80">
          Curated talent, from Kolkata to every stage in India
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Discover verified talent, agency-managed from first enquiry to final
          bow.
        </h1>
        <p className="max-w-xl text-[16.5px] leading-relaxed text-[#f3f4f6]/70">
          Event hosts, classical performers, brand ambassadors, and live
          musicians — every profile personally vetted, every booking mediated by
          our team.
        </p>
        <div className="max-w-xl">
          <SearchBar />
        </div>
        <AlponaMotif className="mt-4 h-8 w-56 text-brass/60" />
      </Container>
    </section>
  );
}
