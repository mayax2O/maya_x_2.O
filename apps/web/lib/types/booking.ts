/**
 * Mirrors the fields BOOKING_REQUESTS will accept from the public site
 * (docs/04-database) — guest_name/email/phone, talent_id, event_date,
 * event_details. `QuickBookingFormValues` is what the form collects and
 * will become the POST body once M3 wires up the real endpoint.
 */

export interface QuickBookingFormValues {
  talentId: string | null;
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  eventDetails: string;
}

export interface QuickBookingSubmission extends QuickBookingFormValues {
  id: string;
  submittedAt: string;
}
