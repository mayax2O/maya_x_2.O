import Link from "next/link";

import type { Talent } from "../../lib/types";
import { MediaFrame } from "../media/MediaFrame";

/**
 * The platform's signature surface (docs/06-design-system §08 Cards) — used
 * identically in the talent listing grid, related-talent rails, and (later)
 * wishlist/admin roster views. A thin `Link` wrapper around `TalentCoverArt`
 * (the profile page reuses that directly, without a self-referencing link).
 */
export function TalentCard({ talent }: { talent: Talent }) {
  return (
    <Link
      href={`/talent/${talent.slug}`}
      className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
    >
      <TalentCoverArt
        talent={talent}
        className="shadow-sm ring-1 ring-ink/5 transition hover:shadow-md"
      />
    </Link>
  );
}

/**
 * Image-forward cover: cover photo, bottom gradient carrying name/city, and
 * status badges overlaid at the corners. Self-contained (`group`/`relative`
 * live here, not on a caller-provided wrapper) so it renders correctly
 * whether it's inside TalentCard's Link or standalone on the profile page.
 * Price, tagline, and availability live on the full profile, not here.
 */
export function TalentCoverArt({
  talent,
  className,
}: {
  talent: Talent;
  className?: string;
}) {
  return (
    <div
      className={["group relative overflow-hidden rounded-xl", className]
        .filter(Boolean)
        .join(" ")}
    >
      <MediaFrame
        src={talent.coverImage.url}
        alt={talent.coverImage.alt}
        aspect="portrait"
        className="transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Bottom fade so white name/city text stays legible over any photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 rounded-b-xl bg-gradient-to-t from-black/90 via-black/40 to-transparent"
      />

      {talent.premium ? (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#12141c]/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brass shadow-sm ring-1 ring-brass/40 backdrop-blur-sm">
          <StarIcon />
          Premium
        </span>
      ) : null}

      {talent.isNew || talent.verified ? (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5">
          {talent.isNew ? <NewBadge /> : null}
          {talent.verified ? <VerifiedBadge /> : null}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-xl font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.5)]">
          {talent.displayName}
        </h3>
        <p className="mt-0.5 text-[13.5px] text-white/75">{talent.city}</p>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden
    >
      <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
    </svg>
  );
}

/** Sticker-style badge for talent added within the last 30 days. */
function NewBadge() {
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[8.5px] font-bold leading-none text-white shadow-sm ring-2 ring-white/80"
      title="New"
    >
      NEW
    </span>
  );
}

/** Sticker-style badge for agency-verified talent (verificationStatus). */
function VerifiedBadge() {
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-sm ring-2 ring-white/80"
      title="Verified"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
