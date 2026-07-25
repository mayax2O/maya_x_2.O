"use client";

import { useEffect, useState } from "react";

import type { HeroMediaItem } from "../../lib/types";
import { AlponaMotif } from "../motifs/AlponaMotif";
import { SearchBar } from "../search/SearchBar";
import { Container } from "../layout/Container";

const SLIDER_INTERVAL_MS = 6000;

// Trust badges (right column) — cycle in one at a time, hold fully
// visible, then fade out together and restart, forever. Driven by a
// single tick counter rather than per-line CSS animation-delays so the
// "all fade out together" reset stays perfectly in sync across lines.
const TRUST_LINES = [
  "100% Privacy",
  "Verified Models",
  "No Hidden Charges",
  "Instant Booking",
];
const TRUST_TICK_MS = 400;
// Ticks spent fully visible (all 4 lines shown) before the reset tick.
const TRUST_HOLD_TICKS = 6;
const TRUST_CYCLE_TICKS = TRUST_LINES.length + TRUST_HOLD_TICKS;

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
  const [trustVisibleCount, setTrustVisibleCount] = useState(0);

  useEffect(() => {
    if (mode !== "slider" || media.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % media.length);
    }, SLIDER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mode, media.length]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick = (tick + 1) % TRUST_CYCLE_TICKS;
      // Ticks beyond TRUST_LINES.length are the "hold" period — clamp so
      // visibleCount just stays at the full count until the cycle wraps
      // back to 0, which is what triggers the synchronized fade-out.
      setTrustVisibleCount(Math.min(tick, TRUST_LINES.length));
    }, TRUST_TICK_MS);
    return () => clearInterval(interval);
  }, []);

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
      <Container className="relative py-20 sm:py-28">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col gap-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-tint/80">
              Curated talent, from Kolkata to every stage in India
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Discover verified talent, agency-managed from first enquiry to
              final bow.
            </h1>
            <p className="max-w-xl text-[16.5px] leading-relaxed text-[#f3f4f6]/70">
              Event hosts, classical performers, brand ambassadors, and live
              musicians — every profile personally vetted, every booking
              mediated by our team.
            </p>
            <div className="max-w-xl">
              <SearchBar />
            </div>
            <AlponaMotif className="mt-4 h-8 w-56 text-brass/60" />
          </div>

          {/* Trust badges — see the ticking useEffect above for the loop. */}
          <ul className="flex shrink-0 flex-col gap-3">
            {TRUST_LINES.map((line, index) => (
              <li
                key={line}
                className={[
                  "whitespace-nowrap font-display text-2xl font-medium text-[#f3f4f6]/90 transition-all duration-500 ease-out sm:text-3xl lg:text-4xl xl:text-5xl",
                  index < trustVisibleCount
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0",
                ].join(" ")}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
