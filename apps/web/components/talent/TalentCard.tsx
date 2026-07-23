import Link from "next/link";

import { formatPrice } from "../../lib/format";
import type { Talent } from "../../lib/types";
import { MediaFrame } from "../media/MediaFrame";
import { AvailabilityBadge } from "./AvailabilityBadge";

/**
 * The platform's signature surface (docs/06-design-system §08 Cards) — used
 * identically in the talent listing grid, related-talent rails, and (later)
 * wishlist/admin roster views. Takes a full `Talent` object so it never
 * needs to change shape when real API data replaces the mock.
 */
export function TalentCard({ talent }: { talent: Talent }) {
  return (
    <Link
      href={`/talent/${talent.slug}`}
      className="group block overflow-hidden rounded-lg bg-porcelain shadow-sm ring-1 ring-ink/5 transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
    >
      <MediaFrame
        src={talent.coverImage.url}
        alt={talent.coverImage.alt}
        aspect="portrait"
        className="transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {talent.displayName}
            </h3>
            <p className="text-[13.5px] text-slate">{talent.tagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[13.5px] font-medium text-ink">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5 text-brass-deep"
            >
              <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
            </svg>
            {talent.rating.toFixed(1)}
          </div>
        </div>

        <p className="text-[13px] text-slate">{talent.city}</p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <AvailabilityBadge availability={talent.availability} />
          <p className="text-[13.5px] font-semibold text-ink">
            From {formatPrice(talent.startingPrice, talent.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}
