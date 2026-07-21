import { AlponaMotif } from "../motifs/AlponaMotif";

/**
 * Stand-in renderer for talent portraits/gallery media until real
 * Cloudinary assets exist. Deliberately takes the same props a real image
 * component would (`src`, `alt`) so swapping the implementation for
 * `next/image` later is a one-file change — no call site (TalentCard,
 * Gallery, profile hero, ...) needs to be touched.
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
  const variant = GRADIENT_VARIANTS[hashToIndex(src, GRADIENT_VARIANTS.length)];

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
