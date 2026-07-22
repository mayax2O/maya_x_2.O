import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BookingListFilters,
  BookingRequest,
  BookingStatus,
  ListQueryParams,
} from "../types";

export function listBookingRequests(
  params: ListQueryParams & BookingListFilters = {},
): Promise<Paginated<BookingRequest>> {
  return authedFetchList<BookingRequest>(
    `/admin/booking-requests${buildQuery(params)}`,
  );
}

export function getBookingRequest(id: string): Promise<BookingRequest> {
  return authedFetch<BookingRequest>(`/booking-requests/${id}`);
}

export function updateBookingStatus(
  id: string,
  newStatus: BookingStatus,
  notes?: string,
): Promise<BookingRequest> {
  return authedFetch<BookingRequest>(`/admin/booking-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ newStatus, notes }),
  });
}
