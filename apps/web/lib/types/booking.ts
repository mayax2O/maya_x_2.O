/**
 * Mirrors apps/api's booking_requests (docs/04-database §3.3) response
 * envelope. `QuickBookingFormValues` is what the form collects locally;
 * `submitBookingRequest` (lib/api/booking.ts) maps it onto the real
 * POST /api/v1/booking-requests body.
 */

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

export interface BookingResponse {
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

export interface QuickBookingFormValues {
  talentId: string | null;
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  eventDetails: string;
}
