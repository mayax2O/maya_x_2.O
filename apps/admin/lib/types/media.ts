export interface MediaVariantUrls {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

export interface MediaAsset {
  id: string;
  folderId: string | null;
  url: string;
  optimizedUrl: string;
  variants: MediaVariantUrls;
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
  // AI-ready metadata — always null/empty today, reserved for a future
  // AI-tagging milestone. See the API's MediaAsset model comment.
  aiDescription: string | null;
  aiTags: string[];
  dominantColor: string | null;
  detectedObjects: unknown | null;
  detectedFaces: unknown | null;
  deletedAt: string | null;
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
  trashed?: boolean;
}

export interface MediaBulkActionResult {
  requested: number;
  affected: number;
}

export interface MediaStats {
  totalAssets: number;
  totalFolders: number;
  trashedAssets: number;
  storageBytes: number;
  unusedAssets: number;
  recentUploads: number;
  duplicateAssets: number;
}
