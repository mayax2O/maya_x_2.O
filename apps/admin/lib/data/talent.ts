import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BulkAction,
  BulkActionResult,
  ListQueryParams,
  Talent,
  TalentFormValues,
  TalentListFilters,
  TalentMedia,
} from "../types";

export function listTalent(
  params: ListQueryParams & TalentListFilters = {},
): Promise<Paginated<Talent>> {
  return authedFetchList<Talent>(`/talent${buildQuery(params)}`);
}

export function getTalent(id: string): Promise<Talent> {
  return authedFetch<Talent>(`/talent/${id}`);
}

export function createTalent(input: TalentFormValues): Promise<Talent> {
  return authedFetch<Talent>("/talent", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTalent(
  id: string,
  input: Partial<TalentFormValues>,
): Promise<Talent> {
  return authedFetch<Talent>(`/talent/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTalent(id: string): Promise<void> {
  return authedFetch<void>(`/talent/${id}`, { method: "DELETE" });
}

export function bulkTalent(
  ids: string[],
  action: BulkAction,
): Promise<BulkActionResult> {
  return authedFetch<BulkActionResult>("/talent/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}

export function addTalentMedia(
  talentId: string,
  input: { mediaAssetId: string; isPrimary?: boolean },
): Promise<TalentMedia> {
  return authedFetch<TalentMedia>(`/talent/${talentId}/media`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function reorderTalentMedia(
  talentId: string,
  mediaIds: string[],
): Promise<TalentMedia[]> {
  return authedFetch<TalentMedia[]>(`/talent/${talentId}/media/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ mediaIds }),
  });
}

export function setPrimaryTalentMedia(
  talentId: string,
  mediaId: string,
): Promise<TalentMedia> {
  return authedFetch<TalentMedia>(
    `/talent/${talentId}/media/${mediaId}/primary`,
    {
      method: "PATCH",
    },
  );
}

export function removeTalentMedia(
  talentId: string,
  mediaId: string,
): Promise<void> {
  return authedFetch<void>(`/talent/${talentId}/media/${mediaId}`, {
    method: "DELETE",
  });
}
