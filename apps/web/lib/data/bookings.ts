import { apiFetch, apiFetchList, type Paginated } from "../api/client";
import type { BookingResponse, QuickBookingFormValues } from "../types";

/**
 * Basic v4-shaped UUID check. Mock talent IDs from lib/mock/talents.json
 * (M2's placeholder data — see lib/data/talents.ts) are not real UUIDs,
 * so a talentId that fails this check can't be a real, bookable Talent
 * row; submitQuickBooking degrades gracefully in that case (see below)
 * rather than letting the API 404.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicTalentOption {
  id: string;
  slug: string;
  displayName: string;
}

/** Real, bookable talent for the Quick Booking talent selector — GET /public/talent. */
export async function listBookableTalent(): Promise<PublicTalentOption[]> {
  const talent = await apiFetch<PublicTalentOption[]>(
    "/public/talent?perPage=100",
  );
  return talent;
}

/**
 * Submits a booking request. Sends the bearer access token when the
 * caller is signed in (Member booking); otherwise submits the guest
 * contact fields collected by the form (Guest booking) — apps/api decides
 * which applies from whether the request carries a valid token at all.
 */
export async function submitQuickBooking(
  values: QuickBookingFormValues,
  accessToken?: string | null,
  talentName?: string,
): Promise<BookingResponse> {
  const talentIsReal = values.talentId
    ? UUID_PATTERN.test(values.talentId)
    : false;

  const eventDetails =
    values.talentId && !talentIsReal
      ? `Interested talent: ${talentName ?? "unspecified"}. ${values.eventDetails}`.trim()
      : values.eventDetails;

  return apiFetch<BookingResponse>("/booking-requests", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: JSON.stringify({
      talentId: talentIsReal ? values.talentId : undefined,
      eventDate: values.eventDate || undefined,
      eventDetails: eventDetails || undefined,
      ...(accessToken
        ? {}
        : {
            guestName: values.fullName,
            guestEmail: values.email,
            guestPhone: values.phone,
          }),
    }),
  });
}

/** GET /me/bookings — the signed-in customer's own booking history. */
export function listMyBookings(
  accessToken: string,
): Promise<Paginated<BookingResponse>> {
  return apiFetchList<BookingResponse>("/me/bookings?perPage=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
