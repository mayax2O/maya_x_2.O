import { authedFetch, authedFetchList, authedUpload } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  MediaAsset,
  MediaBulkActionResult,
  MediaFolder,
  MediaListFilters,
  MediaStats,
} from "../types";

export function listMedia(
  params: MediaListFilters = {},
): Promise<Paginated<MediaAsset>> {
  return authedFetchList<MediaAsset>(`/media${buildQuery(params)}`);
}

export function getMedia(id: string): Promise<MediaAsset> {
  return authedFetch<MediaAsset>(`/media/${id}`);
}

export function uploadMedia(
  file: File,
  options: { folderId?: string; altText?: string } = {},
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.folderId) formData.append("folderId", options.folderId);
  if (options.altText) formData.append("altText", options.altText);
  return authedUpload<MediaAsset>("/media/upload", formData);
}

export function replaceMedia(id: string, file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  return authedUpload<MediaAsset>(`/media/${id}/replace`, formData);
}

export function updateMedia(
  id: string,
  input: {
    altText?: string;
    originalFilename?: string;
    folderId?: string | null;
  },
): Promise<MediaAsset> {
  return authedFetch<MediaAsset>(`/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Moves the asset to Trash (soft delete) — see `restoreMedia`/`permanentlyDeleteMedia`. */
export function deleteMedia(id: string): Promise<void> {
  return authedFetch<void>(`/media/${id}`, { method: "DELETE" });
}

export function restoreMedia(id: string): Promise<MediaAsset> {
  return authedFetch<MediaAsset>(`/media/${id}/restore`, { method: "POST" });
}

/** Only works on an asset already in Trash — removes the Cloudinary object too. */
export function permanentlyDeleteMedia(id: string): Promise<void> {
  return authedFetch<void>(`/media/${id}/permanent`, { method: "DELETE" });
}

export function getMediaStats(): Promise<MediaStats> {
  return authedFetch<MediaStats>("/media/stats");
}

export function bulkDeleteMedia(
  mediaIds: string[],
): Promise<MediaBulkActionResult> {
  return authedFetch<MediaBulkActionResult>("/media/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ mediaIds }),
  });
}

export function bulkMoveMedia(
  mediaIds: string[],
  folderId: string | null,
): Promise<MediaBulkActionResult> {
  return authedFetch<MediaBulkActionResult>("/media/bulk-move", {
    method: "POST",
    body: JSON.stringify({ mediaIds, folderId }),
  });
}

export function reorderMedia(
  mediaIds: string[],
  folderId?: string,
): Promise<MediaAsset[]> {
  return authedFetch<MediaAsset[]>("/media/reorder", {
    method: "POST",
    body: JSON.stringify({ mediaIds, folderId }),
  });
}

export function listMediaFolders(): Promise<MediaFolder[]> {
  return authedFetch<MediaFolder[]>("/media/folders");
}

export function createMediaFolder(
  name: string,
  parentId?: string,
): Promise<MediaFolder> {
  return authedFetch<MediaFolder>("/media/folders", {
    method: "POST",
    body: JSON.stringify({ name, parentId }),
  });
}

export function updateMediaFolder(
  id: string,
  name: string,
): Promise<MediaFolder> {
  return authedFetch<MediaFolder>(`/media/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteMediaFolder(id: string): Promise<void> {
  return authedFetch<void>(`/media/folders/${id}`, { method: "DELETE" });
}
