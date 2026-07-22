import type { BookingStatus } from "../../lib/types";

const LABELS: Record<BookingStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  contacted: "Contacted",
  confirmed: "Confirmed",
  declined: "Declined",
  expired: "Expired",
  cancelled: "Cancelled",
};

const DOT_CLASSES: Record<BookingStatus, string> = {
  submitted: "bg-slate",
  under_review: "bg-warning",
  contacted: "bg-warning",
  confirmed: "bg-success",
  declined: "bg-danger",
  expired: "bg-slate",
  cancelled: "bg-danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-porcelain-soft px-2.5 py-1 text-[12.5px] font-medium text-ink/80">
      <span
        className={["h-1.5 w-1.5 rounded-full", DOT_CLASSES[status]].join(" ")}
        aria-hidden="true"
      />
      {LABELS[status]}
    </span>
  );
}
