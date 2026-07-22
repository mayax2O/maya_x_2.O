import type { MediaFolder } from "@prisma/client";

export interface MediaFolderResponse {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toMediaFolderResponse(
  folder: MediaFolder,
  assetCount: number,
): MediaFolderResponse {
  return {
    id: folder.id,
    name: folder.name,
    slug: folder.slug,
    parentId: folder.parentId,
    assetCount,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}
