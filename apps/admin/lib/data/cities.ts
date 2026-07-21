import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BulkAction,
  BulkActionResult,
  City,
  CreateCityInput,
  ListQueryParams,
  UpdateCityInput,
} from "../types";

export function listCities(
  params: ListQueryParams & { isActive?: boolean } = {},
): Promise<Paginated<City>> {
  return authedFetchList<City>(`/cities${buildQuery(params)}`);
}

export function getCity(id: string): Promise<City> {
  return authedFetch<City>(`/cities/${id}`);
}

export function createCity(input: CreateCityInput): Promise<City> {
  return authedFetch<City>("/cities", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCity(id: string, input: UpdateCityInput): Promise<City> {
  return authedFetch<City>(`/cities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCity(id: string): Promise<void> {
  return authedFetch<void>(`/cities/${id}`, { method: "DELETE" });
}

export function bulkCities(
  ids: string[],
  action: BulkAction,
): Promise<BulkActionResult> {
  return authedFetch<BulkActionResult>("/cities/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
