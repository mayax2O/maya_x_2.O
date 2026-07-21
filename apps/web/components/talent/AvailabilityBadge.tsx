import type { TalentAvailability } from "../../lib/types";

const LABELS: Record<TalentAvailability, string> = {
  available: "Available",
  limited: "Limited availability",
  unavailable: "Unavailable",
};

const DOT_CLASSES: Record<TalentAvailability, string> = {
  available: "bg-success",
  limited: "bg-warning",
  unavailable: "bg-slate",
};

export function AvailabilityBadge({
  availability,
}: {
  availability: TalentAvailability;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-porcelain-soft px-2.5 py-1 text-[12.5px] font-medium text-ink/80">
      <span
        className={["h-1.5 w-1.5 rounded-full", DOT_CLASSES[availability]].join(
          " ",
        )}
        aria-hidden="true"
      />
      {LABELS[availability]}
    </span>
  );
}
