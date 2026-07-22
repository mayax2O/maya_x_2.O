export type BookingStatus =
  | "submitted"
  | "under_review"
  | "contacted"
  | "confirmed"
  | "declined"
  | "expired"
  | "cancelled";

export interface BookingCustomerSummary {
  type: "guest" | "member";
  name: string;
  email: string;
  phone: string | null;
}

export interface BookingStatusHistoryItem {
  id: string;
  previousStatus: BookingStatus | null;
  newStatus: BookingStatus;
  notes: string | null;
  createdAt: string;
}

export interface BookingRequest {
  id: string;
  status: BookingStatus;
  talent: { id: string; slug: string; displayName: string };
  customer: BookingCustomerSummary;
  eventDate: string | null;
  eventDetails: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: BookingStatusHistoryItem[];
}

export interface BookingListFilters {
  q?: string;
  status?: BookingStatus;
  talentId?: string;
}

/**
 * Mirrors apps/api's BookingService STATUS_TRANSITIONS (Enterprise
 * Architecture §7.1) — kept in sync by hand since the two run in separate
 * apps. Used only to disable illegal choices in the status-update UI; the
 * API is still the source of truth and re-validates on every request.
 */
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  submitted: ["under_review", "declined", "expired"],
  under_review: ["contacted", "declined", "expired"],
  contacted: ["confirmed", "declined"],
  confirmed: ["cancelled"],
  declined: [],
  expired: [],
  cancelled: [],
};
