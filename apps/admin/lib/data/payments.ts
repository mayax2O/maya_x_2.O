import { authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type { ListQueryParams, Payment, PaymentListFilters } from "../types";

export function listPayments(
  params: ListQueryParams & PaymentListFilters = {},
): Promise<Paginated<Payment>> {
  return authedFetchList<Payment>(`/admin/payments${buildQuery(params)}`);
}
