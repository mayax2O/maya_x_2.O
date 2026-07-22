export interface MediaAsset {
  id: string;
  folderId: string | null;
  url: string;
  optimizedUrl: string;
  format: string | null;
  resourceType: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  altText: string | null;
  displayOrder: number;
  source: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListFilters {
  search?: string;
  folderId?: string;
  page?: number;
  perPage?: number;
  sort?: "newest" | "oldest" | "name";
}

export interface MediaBulkActionResult {
  requested: number;
  affected: number;
}
