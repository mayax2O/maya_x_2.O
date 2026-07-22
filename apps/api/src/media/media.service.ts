import { createHash } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import imageSize from "image-size";

import { sanitizeFilename } from "../common/sanitize-filename.util";
import { isUniqueConstraintViolation } from "../common/prisma-error.util";
import type { PaginatedResult } from "../common/pagination-result.interface";
import { slugify } from "../common/slug.util";
import type { EnvConfig } from "../config/env.validation";
import { PrismaService } from "../database/prisma.service";
import {
  CLOUDINARY_GATEWAY,
  type CloudinaryGateway,
  type MediaVariantUrls,
} from "./cloudinary-gateway.interface";
import type { BulkDeleteMediaDto } from "./dto/bulk-delete-media.dto";
import type { BulkMoveMediaDto } from "./dto/bulk-move-media.dto";
import type { CreateFolderDto } from "./dto/create-folder.dto";
import type { ListMediaQueryDto } from "./dto/list-media.query.dto";
import type { ReorderMediaDto } from "./dto/reorder-media.dto";
import type { UpdateFolderDto } from "./dto/update-folder.dto";
import type { UpdateMediaDto } from "./dto/update-media.dto";
import {
  toMediaAssetResponse,
  type MediaAssetResponse,
} from "./media-asset.response";
import {
  toMediaFolderResponse,
  type MediaFolderResponse,
} from "./media-folder.response";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export interface UploadMediaInput {
  buffer: Buffer;
  mimetype: string;
  originalFilename: string;
  folderId?: string;
  altText?: string;
}

export interface BulkActionResult {
  requested: number;
  affected: number;
}

export interface MediaStatsResponse {
  totalAssets: number;
  totalFolders: number;
  trashedAssets: number;
  storageBytes: number;
  unusedAssets: number;
  recentUploads: number;
  /**
   * Always 0 by design, not by omission: `contentHash`'s DB-level unique
   * constraint makes a true byte-for-byte duplicate structurally
   * impossible in this table (see `upload`'s dedup check) — reported here
   * so the dashboard can show it explicitly rather than silently drop it.
   */
  duplicateAssets: 0;
}

const RECENT_UPLOADS_WINDOW_DAYS = 7;

@Injectable()
export class MediaService {
  private readonly maxUploadBytes: number;
  private readonly maxDimensionPx: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOUDINARY_GATEWAY)
    private readonly cloudinary: CloudinaryGateway,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.maxUploadBytes = configService.get("MEDIA_MAX_UPLOAD_BYTES", {
      infer: true,
    });
    this.maxDimensionPx = configService.get("MEDIA_MAX_DIMENSION_PX", {
      infer: true,
    });
  }

  async upload(input: UploadMediaInput): Promise<MediaAssetResponse> {
    this.validateMimeType(input.mimetype);
    this.validateSize(input.buffer.length);
    this.validateDimensions(input.buffer);

    const contentHash = createHash("sha256").update(input.buffer).digest("hex");

    // Intentionally not scoped to deletedAt: null — contentHash is globally
    // unique, so if a trashed asset already has these exact bytes, the
    // right move is to restore it (undelete), not fail on the unique
    // constraint trying to insert a second row with the same hash.
    const existing = await this.prisma.mediaAsset.findUnique({
      where: { contentHash },
    });
    if (existing) {
      const restored = existing.deletedAt
        ? await this.prisma.mediaAsset.update({
            where: { id: existing.id },
            data: { deletedAt: null },
          })
        : existing;
      const usageCount = await this.countUsage(restored.id);
      return toMediaAssetResponse(
        restored,
        usageCount,
        this.buildVariants(restored),
      );
    }

    if (input.folderId) {
      await this.findFolderOrThrow(input.folderId);
    }

    const sanitizedFilename = sanitizeFilename(input.originalFilename);
    const uploaded = await this.cloudinary.uploadAsset({
      buffer: input.buffer,
      folder: input.folderId,
      filenameHint: sanitizedFilename,
    });

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          folderId: input.folderId,
          publicId: uploaded.publicId,
          url: uploaded.url,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
          contentHash,
          originalFilename: sanitizedFilename,
          altText: input.altText,
          source: "cloudinary",
        },
      });
      return toMediaAssetResponse(asset, 0, this.buildVariants(asset));
    } catch (error) {
      // Roll back the Cloudinary upload if we couldn't persist the row
      // (e.g. a race on contentHash's unique constraint) — never leave an
      // orphaned remote asset with no local record.
      await this.cloudinary.deleteAsset(uploaded.publicId).catch(() => {
        // best-effort cleanup only
      });
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "MEDIA_DUPLICATE_UPLOAD",
          message: "This image has already been uploaded.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListMediaQueryDto,
  ): Promise<PaginatedResult<MediaAssetResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 24;

    const where = {
      deletedAt: query.trashed ? { not: null } : null,
      ...(query.folderId ? { folderId: query.folderId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                originalFilename: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                altText: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const orderBy =
      query.sort === "oldest"
        ? { createdAt: "asc" as const }
        : query.sort === "name"
          ? { originalFilename: "asc" as const }
          : { createdAt: "desc" as const };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    const usageCounts = await this.countUsageForMany(rows.map((r) => r.id));

    return {
      items: rows.map((asset) =>
        toMediaAssetResponse(
          asset,
          usageCounts.get(asset.id) ?? 0,
          this.buildVariants(asset),
        ),
      ),
      total,
    };
  }

  async findOne(id: string): Promise<MediaAssetResponse> {
    const asset = await this.findAssetOrThrow(id);
    const usageCount = await this.countUsage(id);
    return toMediaAssetResponse(asset, usageCount, this.buildVariants(asset));
  }

  async update(id: string, dto: UpdateMediaDto): Promise<MediaAssetResponse> {
    await this.findAssetOrThrow(id);
    if (dto.folderId) {
      await this.findFolderOrThrow(dto.folderId);
    }

    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        altText: dto.altText,
        originalFilename: dto.originalFilename
          ? sanitizeFilename(dto.originalFilename)
          : undefined,
        folderId: dto.folderId === undefined ? undefined : dto.folderId,
      },
    });
    const usageCount = await this.countUsage(id);
    return toMediaAssetResponse(asset, usageCount, this.buildVariants(asset));
  }

  /** Uploads a new file and points the same MediaAsset row at it, deleting the old Cloudinary asset. */
  async replace(
    id: string,
    input: Omit<UploadMediaInput, "folderId" | "altText">,
  ): Promise<MediaAssetResponse> {
    const existing = await this.findAssetOrThrow(id);
    this.validateMimeType(input.mimetype);
    this.validateSize(input.buffer.length);
    this.validateDimensions(input.buffer);

    const contentHash = createHash("sha256").update(input.buffer).digest("hex");
    const sanitizedFilename = sanitizeFilename(input.originalFilename);
    const uploaded = await this.cloudinary.uploadAsset({
      buffer: input.buffer,
      folder: existing.folderId ?? undefined,
      filenameHint: sanitizedFilename,
    });

    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        publicId: uploaded.publicId,
        url: uploaded.url,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
        contentHash,
        originalFilename: sanitizedFilename,
      },
    });

    if (existing.publicId) {
      await this.cloudinary.deleteAsset(existing.publicId).catch(() => {
        // best-effort cleanup only — the new asset is already persisted
      });
    }

    const usageCount = await this.countUsage(id);
    return toMediaAssetResponse(asset, usageCount, this.buildVariants(asset));
  }

  /**
   * Soft delete — moves the asset to Trash (`deletedAt` set). The Cloudinary
   * object is left untouched so `restore` can bring it back exactly as it
   * was; only `permanentDelete` actually removes it from Cloudinary.
   */
  async remove(id: string): Promise<void> {
    await this.findAssetOrThrow(id);
    const usageCount = await this.countUsage(id);
    if (usageCount > 0) {
      throw new ConflictException({
        code: "MEDIA_IN_USE",
        message: `This image is used in ${usageCount} place(s). Remove it from those first.`,
      });
    }

    await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<MediaAssetResponse> {
    await this.findTrashedAssetOrThrow(id);
    const restored = await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: null },
    });
    const usageCount = await this.countUsage(id);
    return toMediaAssetResponse(
      restored,
      usageCount,
      this.buildVariants(restored),
    );
  }

  /** Permanently deletes a Trashed asset — Cloudinary object included. Must already be in Trash (`remove` first). */
  async permanentDelete(id: string): Promise<void> {
    const asset = await this.findTrashedAssetOrThrow(id);
    await this.prisma.mediaAsset.delete({ where: { id } });
    if (asset.publicId) {
      await this.cloudinary.deleteAsset(asset.publicId).catch(() => {
        // best-effort cleanup only — the DB row is already gone
      });
    }
  }

  /** Bulk soft delete — see `remove`'s doc comment for the Trash semantics. */
  async bulkDelete(dto: BulkDeleteMediaDto): Promise<BulkActionResult> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: dto.mediaIds }, deletedAt: null },
    });
    const usageCounts = await this.countUsageForMany(assets.map((a) => a.id));
    const deletable = assets.filter(
      (asset) => (usageCounts.get(asset.id) ?? 0) === 0,
    );

    if (deletable.length > 0) {
      await this.prisma.mediaAsset.updateMany({
        where: { id: { in: deletable.map((a) => a.id) } },
        data: { deletedAt: new Date() },
      });
    }

    return { requested: dto.mediaIds.length, affected: deletable.length };
  }

  async bulkMove(dto: BulkMoveMediaDto): Promise<BulkActionResult> {
    if (dto.folderId) {
      await this.findFolderOrThrow(dto.folderId);
    }
    const result = await this.prisma.mediaAsset.updateMany({
      where: { id: { in: dto.mediaIds }, deletedAt: null },
      data: { folderId: dto.folderId ?? null },
    });
    return { requested: dto.mediaIds.length, affected: result.count };
  }

  /** Reorders assets within a single folder (or the unfiled bucket) for grid display. */
  async reorder(
    folderId: string | undefined,
    dto: ReorderMediaDto,
  ): Promise<MediaAssetResponse[]> {
    const existing = await this.prisma.mediaAsset.findMany({
      where: { folderId: folderId ?? null, deletedAt: null },
    });
    const existingIds = new Set(existing.map((item) => item.id));
    const isSameSet =
      dto.mediaIds.length === existing.length &&
      dto.mediaIds.every((id) => existingIds.has(id));

    if (!isSameSet) {
      throw new BadRequestException({
        code: "MEDIA_REORDER_MISMATCH",
        message:
          "mediaIds must include exactly the target folder's current asset ids.",
      });
    }

    const updated = await this.prisma.$transaction(
      dto.mediaIds.map((id, index) =>
        this.prisma.mediaAsset.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    const usageCounts = await this.countUsageForMany(updated.map((a) => a.id));

    return updated
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((asset) =>
        toMediaAssetResponse(
          asset,
          usageCounts.get(asset.id) ?? 0,
          this.buildVariants(asset),
        ),
      );
  }

  // --- Folders ---

  async createFolder(dto: CreateFolderDto): Promise<MediaFolderResponse> {
    if (dto.parentId) {
      await this.findFolderOrThrow(dto.parentId);
    }
    try {
      const folder = await this.prisma.mediaFolder.create({
        data: {
          name: dto.name,
          slug: slugify(dto.name),
          parentId: dto.parentId,
        },
      });
      return toMediaFolderResponse(folder, 0);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "MEDIA_FOLDER_SLUG_CONFLICT",
          message: "A folder with this name already exists.",
        });
      }
      throw error;
    }
  }

  async findAllFolders(): Promise<MediaFolderResponse[]> {
    const folders = await this.prisma.mediaFolder.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    });
    return folders.map((folder) =>
      toMediaFolderResponse(folder, folder._count.assets),
    );
  }

  async updateFolder(
    id: string,
    dto: UpdateFolderDto,
  ): Promise<MediaFolderResponse> {
    await this.findFolderOrThrow(id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException({
          code: "MEDIA_FOLDER_INVALID_PARENT",
          message: "A folder cannot be its own parent.",
        });
      }
      await this.findFolderOrThrow(dto.parentId);
    }

    try {
      const updated = await this.prisma.mediaFolder.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.name ? slugify(dto.name) : undefined,
          parentId: dto.parentId,
        },
        include: { _count: { select: { assets: true } } },
      });
      return toMediaFolderResponse(updated, updated._count.assets);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "MEDIA_FOLDER_SLUG_CONFLICT",
          message: "A folder with this name already exists.",
        });
      }
      throw error;
    }
  }

  async removeFolder(id: string): Promise<void> {
    await this.findFolderOrThrow(id);

    // Both the asset and child-folder FKs use onDelete: SetNull/SetNull, so
    // a delete would silently succeed and orphan them rather than throwing
    // a foreign key violation — check occupancy explicitly instead.
    const [assetCount, childFolderCount] = await Promise.all([
      this.prisma.mediaAsset.count({ where: { folderId: id } }),
      this.prisma.mediaFolder.count({ where: { parentId: id } }),
    ]);
    if (assetCount > 0 || childFolderCount > 0) {
      throw new ConflictException({
        code: "MEDIA_FOLDER_NOT_EMPTY",
        message:
          "This folder still contains assets or sub-folders. Move or delete them first.",
      });
    }

    await this.prisma.mediaFolder.delete({ where: { id } });
  }

  // --- Dashboard ---

  async getStats(): Promise<MediaStatsResponse> {
    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - RECENT_UPLOADS_WINDOW_DAYS);

    const [
      totalAssets,
      totalFolders,
      trashedAssets,
      storageAggregate,
      unusedAssets,
      recentUploads,
    ] = await Promise.all([
      this.prisma.mediaAsset.count({ where: { deletedAt: null } }),
      this.prisma.mediaFolder.count(),
      this.prisma.mediaAsset.count({ where: { deletedAt: { not: null } } }),
      this.prisma.mediaAsset.aggregate({
        where: { deletedAt: null },
        _sum: { bytes: true },
      }),
      this.prisma.mediaAsset.count({
        where: { deletedAt: null, usages: { none: {} } },
      }),
      this.prisma.mediaAsset.count({
        where: { deletedAt: null, createdAt: { gte: recentSince } },
      }),
    ]);

    return {
      totalAssets,
      totalFolders,
      trashedAssets,
      storageBytes: storageAggregate._sum.bytes ?? 0,
      unusedAssets,
      recentUploads,
      duplicateAssets: 0,
    };
  }

  // --- Shared helpers (used by TalentService too, via export below) ---

  async countUsage(mediaAssetId: string): Promise<number> {
    return this.prisma.mediaUsage.count({ where: { mediaAssetId } });
  }

  private async countUsageForMany(
    mediaAssetIds: string[],
  ): Promise<Map<string, number>> {
    if (mediaAssetIds.length === 0) return new Map();
    const grouped = await this.prisma.mediaUsage.groupBy({
      by: ["mediaAssetId"],
      where: { mediaAssetId: { in: mediaAssetIds } },
      _count: { _all: true },
    });
    return new Map(grouped.map((g) => [g.mediaAssetId, g._count._all]));
  }

  /**
   * Legacy assets (`source: "legacy"`, backfilled from pre-M6 TalentMedia
   * rows) have no `publicId` — there's nothing in Cloudinary to build a
   * transformation URL against, so every variant falls back to the raw
   * stored `url` unchanged.
   */
  private buildVariants(asset: {
    publicId: string | null;
    url: string;
  }): MediaVariantUrls {
    if (!asset.publicId) {
      return {
        thumbnail: asset.url,
        medium: asset.url,
        large: asset.url,
        original: asset.url,
      };
    }
    return this.cloudinary.buildVariantUrls(asset.publicId);
  }

  private validateMimeType(mimetype: string): void {
    if (!ALLOWED_MIME_TYPES[mimetype]) {
      throw new BadRequestException({
        code: "MEDIA_UNSUPPORTED_TYPE",
        message: "Only JPG, PNG, WEBP, and AVIF images are supported.",
      });
    }
  }

  private validateSize(bytes: number): void {
    if (bytes > this.maxUploadBytes) {
      throw new BadRequestException({
        code: "MEDIA_FILE_TOO_LARGE",
        message: `File exceeds the maximum upload size of ${Math.floor(this.maxUploadBytes / (1024 * 1024))}MB.`,
      });
    }
  }

  private validateDimensions(buffer: Buffer): {
    width?: number;
    height?: number;
  } {
    let dimensions: { width?: number; height?: number };
    try {
      dimensions = imageSize(buffer);
    } catch {
      throw new BadRequestException({
        code: "MEDIA_INVALID_IMAGE",
        message: "The uploaded file is not a valid image.",
      });
    }
    if (
      (dimensions.width && dimensions.width > this.maxDimensionPx) ||
      (dimensions.height && dimensions.height > this.maxDimensionPx)
    ) {
      throw new BadRequestException({
        code: "MEDIA_DIMENSIONS_TOO_LARGE",
        message: `Image dimensions exceed the maximum of ${this.maxDimensionPx}px per side.`,
      });
    }
    return dimensions;
  }

  private async findAssetOrThrow(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException({
        code: "MEDIA_ASSET_NOT_FOUND",
        message: "Media asset not found.",
      });
    }
    return asset;
  }

  private async findTrashedAssetOrThrow(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!asset) {
      throw new NotFoundException({
        code: "MEDIA_ASSET_NOT_IN_TRASH",
        message: "This image isn't in Trash (move it to Trash first).",
      });
    }
    return asset;
  }

  private async findFolderOrThrow(id: string) {
    const folder = await this.prisma.mediaFolder.findUnique({ where: { id } });
    if (!folder) {
      throw new NotFoundException({
        code: "MEDIA_FOLDER_NOT_FOUND",
        message: "Media folder not found.",
      });
    }
    return folder;
  }
}
