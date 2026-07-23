"use client";

import { useEffect, useRef, useState } from "react";

import { AlponaMotif } from "../motifs/AlponaMotif";

/**
 * Renders a real image when `src` is a usable URL (real Cloudinary assets
 * exist as of the Talent Catalog wiring); falls back to a deterministic
 * brass/ink gradient placeholder when there's no image yet, or the image
 * fails to load (e.g. a stale/broken URL).
 */

const ASPECT_CLASSES = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  wide: "aspect-[16/9]",
} as const;

// Deterministic (not random) brass/ink gradient variants, keyed by a hash
// of the alt text, so the same media item always renders the same tone
// across a page (e.g. cover image vs. gallery thumbnail).
const GRADIENT_VARIANTS = [
  "from-ink to-ink-soft",
  "from-brass-deep to-ink",
  "from-ink-soft to-brass-deep",
  "from-ink to-slate",
];

function hashToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

export interface MediaFrameProps {
  src: string;
  alt: string;
  aspect?: keyof typeof ASPECT_CLASSES;
  className?: string;
}

export function MediaFrame({
  src,
  alt,
  aspect = "portrait",
  className,
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // An <img> that already 404'd during the initial (pre-hydration) HTML
  // paint won't fire a fresh `error` event once React attaches onError —
  // the browser doesn't re-request an already-failed resource. Check the
  // element's real load state once on mount to catch that case too.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (!src || failed) {
    const variant =
      GRADIENT_VARIANTS[hashToIndex(src || alt, GRADIENT_VARIANTS.length)];
    return (
      <div
        role="img"
        aria-label={alt}
        className={[
          "relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-brass-tint/70",
          ASPECT_CLASSES[aspect],
          variant,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <AlponaMotif className="absolute inset-x-4 bottom-4 h-6 w-auto opacity-40" />
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg",
        ASPECT_CLASSES[aspect],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URLs; no next.config remotePatterns set up for this yet. */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
