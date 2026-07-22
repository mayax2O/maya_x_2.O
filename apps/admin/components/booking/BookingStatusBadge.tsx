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

const TONE_CLASSES: Record<BookingStatus, string> = {
  submitted: "bg-white/10 text-porcelain/70",
  under_review: "bg-brass-deep/20 text-brass",
  contacted: "bg-brass-deep/20 text-brass",
  confirmed: "bg-success/20 text-success",
  declined: "bg-danger/20 text-danger",
  expired: "bg-white/10 text-porcelain/50",
  cancelled: "bg-danger/20 text-danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium",
        TONE_CLASSES[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
