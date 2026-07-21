import type { Talent } from "../../lib/types";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Read-only approximation of how this profile will render on the public site's talent card/profile. */
export function TalentProfilePreview({ talent }: { talent: Talent }) {
  const primaryImage =
    talent.media.find((item) => item.isPrimary) ?? talent.media[0];

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-ink">
      <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-ink-soft to-ink px-4 text-center text-[12px] text-porcelain/40">
        {primaryImage ? primaryImage.alt : "No primary image set"}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-porcelain">
              {talent.displayName}
            </h3>
            <p className="text-[13px] text-porcelain/60">{talent.tagline}</p>
          </div>
          <span className="shrink-0 rounded-full bg-porcelain/10 px-2 py-1 text-[12px] text-porcelain/70">
            {talent.availability}
          </span>
        </div>
        <p className="text-[12.5px] text-porcelain/50">
          {talent.city.name}
          {talent.location ? ` · ${talent.location.name}` : ""}
        </p>
        <p className="text-[13.5px] font-semibold text-porcelain">
          From {formatPrice(talent.pricing.basePrice, talent.pricing.currency)}
        </p>
        {talent.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {talent.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-brass-deep/20 px-2 py-0.5 text-[11px] text-brass"
              >
                {category.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
