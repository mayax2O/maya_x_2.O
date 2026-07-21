import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BulkAction,
  BulkActionResult,
  CreateLocationInput,
  ListQueryParams,
  Location,
  UpdateLocationInput,
} from "../types";

export function listLocations(
  params: ListQueryParams & { isActive?: boolean; cityId?: string } = {},
): Promise<Paginated<Location>> {
  return authedFetchList<Location>(`/locations${buildQuery(params)}`);
}

export function getLocation(id: string): Promise<Location> {
  return authedFetch<Location>(`/locations/${id}`);
}

export function createLocation(input: CreateLocationInput): Promise<Location> {
  return authedFetch<Location>("/locations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<Location> {
  return authedFetch<Location>(`/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteLocation(id: string): Promise<void> {
  return authedFetch<void>(`/locations/${id}`, { method: "DELETE" });
}

export function bulkLocations(
  ids: string[],
  action: BulkAction,
): Promise<BulkActionResult> {
  return authedFetch<BulkActionResult>("/locations/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
