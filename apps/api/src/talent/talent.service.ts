import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import {
  CLOUDINARY_GATEWAY,
  type CloudinaryGateway,
} from "../media/cloudinary-gateway.interface";
import { PrismaService } from "../database/prisma.service";
import type {
  BulkActionDto,
  BulkActionResult,
} from "../common/dto/bulk-action.dto";
import type { PaginatedResult } from "../common/pagination-result.interface";
import {
  isForeignKeyConstraintViolation,
  isUniqueConstraintViolation,
} from "../common/prisma-error.util";
import { slugify } from "../common/slug.util";
import type { CreateTalentDto } from "./dto/create-talent.dto";
import type { CreateTalentMediaDto } from "./dto/create-talent-media.dto";
import type { ListPublicTalentCatalogQueryDto } from "./dto/list-public-talent-catalog.query.dto";
import type { ListTalentQueryDto } from "./dto/list-talent.query.dto";
import type { ReorderTalentMediaDto } from "./dto/reorder-talent-media.dto";
import type { UpdateTalentDto } from "./dto/update-talent.dto";
import {
  toTalentMediaResponse,
  type TalentMediaResponse,
} from "./talent-media.response";
import {
  toPublicTalentCatalogResponse,
  toTalentResponse,
  type PublicTalentCatalogResponse,
  type TalentResponse,
  type TalentWithRelations,
} from "./talent.response";

const TALENT_INCLUDE = {
  city: true,
  location: true,
  categories: { include: { category: true } },
  subCategories: { include: { subCategory: true } },
  media: { include: { mediaAsset: true } },
} satisfies Prisma.TalentInclude;

// TalentMedia (M4) migrated to reference the M6 Media Library's MediaAsset
// instead of storing its own url/alt. Usage tracking lives in MediaUsage
// (entityType "talent_gallery", entityId = talentId) so the Media Library
// can show accurate "used in N places" counts and refuse to delete an
// in-use asset.
const TALENT_GALLERY_USAGE_TYPE = "talent_gallery";

// The public home page renders Featured talent as one fixed row of three,
// so the roster is capped here rather than silently truncated at render
// time — an admin who ticks a fourth gets told why instead of wondering
// where it went. Premium is deliberately uncapped: its home-page row is a
// continuously scrolling marquee that takes any number.
export const MAX_FEATURED_TALENTS = 3;

// The admin form collects Chest/Waist/Hip as separate inputs, but apps/web's
// public talent profile page still renders the single legacy "measurements"
// string (e.g. "34-28-35") — compose one from the other so that page needed
// no changes for the split. Falls back to a directly-provided `measurements`
// value (e.g. from the seed script) when no chest/waist/hip were supplied.
function composeMeasurements(fields: {
  chest?: string;
  waist?: string;
  hip?: string;
  measurements?: string;
}): string | undefined {
  if (fields.chest || fields.waist || fields.hip) {
    return [fields.chest, fields.waist, fields.hip]
      .map((value) => value?.trim() || "-")
      .join("-");
  }
  return fields.measurements;
}

const SORTABLE_FIELDS = new Set([
  "displayName",
  "basePrice",
  "displayOrder",
  "createdAt",
  "age",
]);

@Injectable()
export class TalentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOUDINARY_GATEWAY)
    private readonly cloudinary: CloudinaryGateway,
  ) {}

  async create(dto: CreateTalentDto, adminId: string): Promise<TalentResponse> {
    const { categoryIds, subCategoryIds, ...rest } = dto;

    if (rest.isFeatured) await this.assertFeaturedSlotAvailable();

    try {
      const talent = await this.prisma.talent.create({
        data: {
          displayName: rest.displayName,
          slug: rest.slug ?? slugify(rest.displayName),
          tagline: rest.tagline,
          bio: rest.bio,
          age: rest.age,
          cityId: rest.cityId,
          locationId: rest.locationId,
          languages: rest.languages ?? [],
          heightCm: rest.heightCm,
          weightKg: rest.weightKg,
          bodyType: rest.bodyType,
          preferredCityIds: rest.preferredCityIds ?? [],
          availableOutside: rest.availableOutside ?? false,
          nationality: rest.nationality,
          measurements: composeMeasurements(rest),
          chest: rest.chest,
          waist: rest.waist,
          hip: rest.hip,
          dressSize: rest.dressSize,
          hairColour: rest.hairColour,
          hairLength: rest.hairLength,
          eyeColour: rest.eyeColour,
          generalAvailability: rest.generalAvailability,
          mobile: rest.mobile,
          mobile2: rest.mobile2,
          whatsapp: rest.whatsapp,
          telegram: rest.telegram,
          otherContact: rest.otherContact,
          currency: rest.currency ?? "INR",
          basePrice: rest.basePrice,
          hourlyRate: rest.hourlyRate,
          overnightRate: rest.overnightRate,
          weekendRate: rest.weekendRate,
          customPricingNotes: rest.customPricingNotes,
          availability: rest.availability,
          verificationStatus: rest.verificationStatus,
          isPremium: rest.isPremium ?? false,
          isFeatured: rest.isFeatured ?? false,
          isActive: rest.isActive ?? true,
          displayOrder: rest.displayOrder ?? 0,
          createdBy: adminId,
          updatedBy: adminId,
          categories: categoryIds
            ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
          subCategories: subCategoryIds
            ? {
                create: subCategoryIds.map((subCategoryId) => ({
                  subCategoryId,
                })),
              }
            : undefined,
        },
        include: TALENT_INCLUDE,
      });
      return toTalentResponse(talent, this.buildOptimizedUrl);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "TALENT_SLUG_CONFLICT",
          message: "A talent with this slug already exists.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new BadRequestException({
          code: "INVALID_REFERENCE",
          message: "The selected city, location, or category does not exist.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListTalentQueryDto,
  ): Promise<PaginatedResult<TalentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.TalentWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isFeatured !== undefined
        ? { isFeatured: query.isFeatured }
        : {}),
      ...(query.isPremium !== undefined ? { isPremium: query.isPremium } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.availability ? { availability: query.availability } : {}),
      ...(query.verificationStatus
        ? { verificationStatus: query.verificationStatus }
        : {}),
      ...(query.categorySlug
        ? { categories: { some: { category: { slug: query.categorySlug } } } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { displayName: { contains: query.q, mode: "insensitive" } },
              { tagline: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "displayOrder";

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.talent.findMany({
        where,
        include: TALENT_INCLUDE,
        orderBy: { [sortBy]: query.sortOrder ?? "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.talent.count({ where }),
    ]);

    return {
      items: rows.map((talent) =>
        toTalentResponse(talent, this.buildOptimizedUrl),
      ),
      total,
    };
  }

  async findOne(id: string): Promise<TalentResponse> {
    const talent = await this.findActiveTalentOrThrow(id);
    return toTalentResponse(talent, this.buildOptimizedUrl);
  }

  // --- Public Talent Catalog (GET /public/talent-catalog) — unauthenticated
  // browse experience for apps/web. Always scoped to isActive/not-deleted,
  // and returns the stripped PublicTalentCatalogResponse shape (see
  // toPublicTalentCatalogResponse) rather than the admin TalentResponse — no
  // Mobile 2/Telegram/Others, and preferredCityIds resolved to real names.

  async findAllPublic(
    query: ListPublicTalentCatalogQueryDto,
  ): Promise<PaginatedResult<PublicTalentCatalogResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.TalentWhereInput = {
      deletedAt: null,
      isActive: true,
      ...(query.city ? { city: { name: query.city } } : {}),
      ...(query.availability ? { availability: query.availability } : {}),
      ...(query.categorySlug
        ? { categories: { some: { category: { slug: query.categorySlug } } } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { displayName: { contains: query.q, mode: "insensitive" } },
              { tagline: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TalentOrderByWithRelationInput =
      query.sort === "price-asc"
        ? { basePrice: "asc" }
        : query.sort === "price-desc"
          ? { basePrice: "desc" }
          : { isFeatured: "desc" };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.talent.findMany({
        where,
        include: TALENT_INCLUDE,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.talent.count({ where }),
    ]);

    const cityNameById = await this.resolveCityNames(
      rows.flatMap((row) => row.preferredCityIds),
    );

    return {
      items: rows.map((talent) =>
        toPublicTalentCatalogResponse(
          talent,
          this.buildOptimizedUrl,
          cityNameById,
        ),
      ),
      total,
    };
  }

  async findBySlugPublic(slug: string): Promise<PublicTalentCatalogResponse> {
    const talent = await this.prisma.talent.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: TALENT_INCLUDE,
    });
    if (!talent) {
      throw new NotFoundException({
        code: "TALENT_NOT_FOUND",
        message: "Talent not found.",
      });
    }
    const cityNameById = await this.resolveCityNames(talent.preferredCityIds);
    return toPublicTalentCatalogResponse(
      talent,
      this.buildOptimizedUrl,
      cityNameById,
    );
  }

  /** Batch-resolves Preferred Area city ids to names for the public response. */
  private async resolveCityNames(
    cityIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(cityIds));
    if (uniqueIds.length === 0) return new Map();

    const cities = await this.prisma.city.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true },
    });
    return new Map(cities.map((city) => [city.id, city.name]));
  }

  async listPublicCities(): Promise<string[]> {
    const rows = await this.prisma.talent.findMany({
      where: { isActive: true, deletedAt: null },
      select: { city: { select: { name: true } } },
      distinct: ["cityId"],
    });
    return Array.from(new Set(rows.map((row) => row.city.name))).sort();
  }

  async update(
    id: string,
    dto: UpdateTalentDto,
    adminId: string,
  ): Promise<TalentResponse> {
    await this.findActiveTalentOrThrow(id);
    const { categoryIds, subCategoryIds, ...rest } = dto;

    if (rest.isFeatured) await this.assertFeaturedSlotAvailable(id);

    try {
      const talent = await this.prisma.$transaction(async (tx) => {
        if (categoryIds) {
          await tx.talentCategoryMap.deleteMany({ where: { talentId: id } });
          if (categoryIds.length > 0) {
            await tx.talentCategoryMap.createMany({
              data: categoryIds.map((categoryId) => ({
                talentId: id,
                categoryId,
              })),
            });
          }
        }

        if (subCategoryIds) {
          await tx.talentSubCategoryMap.deleteMany({
            where: { talentId: id },
          });
          if (subCategoryIds.length > 0) {
            await tx.talentSubCategoryMap.createMany({
              data: subCategoryIds.map((subCategoryId) => ({
                talentId: id,
                subCategoryId,
              })),
            });
          }
        }

        return tx.talent.update({
          where: { id },
          data: {
            ...rest,
            measurements: composeMeasurements(rest),
            updatedBy: adminId,
          },
          include: TALENT_INCLUDE,
        });
      });
      return toTalentResponse(talent, this.buildOptimizedUrl);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "TALENT_SLUG_CONFLICT",
          message: "A talent with this slug already exists.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new BadRequestException({
          code: "INVALID_REFERENCE",
          message: "The selected city, location, or category does not exist.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findActiveTalentOrThrow(id);
    await this.prisma.talent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkAction(dto: BulkActionDto): Promise<BulkActionResult> {
    if (dto.action === "delete") {
      const result = await this.prisma.talent.updateMany({
        where: { id: { in: dto.ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { requested: dto.ids.length, affected: result.count };
    }

    const result = await this.prisma.talent.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { isActive: dto.action === "activate" },
    });
    return { requested: dto.ids.length, affected: result.count };
  }

  // --- Gallery (TalentMedia) ---

  async addMedia(
    talentId: string,
    dto: CreateTalentMediaDto,
  ): Promise<TalentMediaResponse> {
    await this.findActiveTalentOrThrow(talentId);

    const mediaAsset = await this.prisma.mediaAsset.findFirst({
      where: { id: dto.mediaAssetId, deletedAt: null },
    });
    if (!mediaAsset) {
      throw new NotFoundException({
        code: "MEDIA_ASSET_NOT_FOUND",
        message: "Media asset not found.",
      });
    }

    const existingCount = await this.prisma.talentMedia.count({
      where: { talentId },
    });

    try {
      const media = await this.prisma.$transaction(async (tx) => {
        const makePrimary = dto.isPrimary ?? existingCount === 0;
        if (makePrimary) {
          await tx.talentMedia.updateMany({
            where: { talentId },
            data: { isPrimary: false },
          });
        }
        const created = await tx.talentMedia.create({
          data: {
            talentId,
            mediaAssetId: dto.mediaAssetId,
            isPrimary: makePrimary,
            displayOrder: existingCount,
          },
          include: { mediaAsset: true },
        });
        await tx.mediaUsage.create({
          data: {
            mediaAssetId: dto.mediaAssetId,
            entityType: TALENT_GALLERY_USAGE_TYPE,
            entityId: talentId,
          },
        });
        return created;
      });

      return toTalentMediaResponse(media, this.buildOptimizedUrl);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "TALENT_MEDIA_ALREADY_ADDED",
          message: "This image is already in this talent's gallery.",
        });
      }
      throw error;
    }
  }

  async removeMedia(talentId: string, mediaId: string): Promise<void> {
    await this.findActiveTalentOrThrow(talentId);
    const media = await this.findTalentMediaOrThrow(talentId, mediaId);

    await this.prisma.$transaction(async (tx) => {
      await tx.talentMedia.delete({ where: { id: mediaId } });
      await tx.mediaUsage.deleteMany({
        where: {
          mediaAssetId: media.mediaAssetId,
          entityType: TALENT_GALLERY_USAGE_TYPE,
          entityId: talentId,
        },
      });

      if (media.isPrimary) {
        const next = await tx.talentMedia.findFirst({
          where: { talentId },
          orderBy: { displayOrder: "asc" },
        });
        if (next) {
          await tx.talentMedia.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
        }
      }
    });
  }

  async setPrimaryMedia(
    talentId: string,
    mediaId: string,
  ): Promise<TalentMediaResponse> {
    await this.findActiveTalentOrThrow(talentId);
    await this.findTalentMediaOrThrow(talentId, mediaId);

    await this.prisma.$transaction([
      this.prisma.talentMedia.updateMany({
        where: { talentId },
        data: { isPrimary: false },
      }),
      this.prisma.talentMedia.update({
        where: { id: mediaId },
        data: { isPrimary: true },
      }),
    ]);

    const media = await this.prisma.talentMedia.findUniqueOrThrow({
      where: { id: mediaId },
      include: { mediaAsset: true },
    });
    return toTalentMediaResponse(media, this.buildOptimizedUrl);
  }

  async reorderMedia(
    talentId: string,
    dto: ReorderTalentMediaDto,
  ): Promise<TalentMediaResponse[]> {
    await this.findActiveTalentOrThrow(talentId);

    const existing = await this.prisma.talentMedia.findMany({
      where: { talentId },
    });
    const existingIds = new Set(existing.map((item) => item.id));
    const isSameSet =
      dto.mediaIds.length === existing.length &&
      dto.mediaIds.every((id) => existingIds.has(id));

    if (!isSameSet) {
      throw new BadRequestException({
        code: "MEDIA_REORDER_MISMATCH",
        message:
          "mediaIds must include exactly the gallery's current image ids.",
      });
    }

    await this.prisma.$transaction(
      dto.mediaIds.map((mediaId, index) =>
        this.prisma.talentMedia.update({
          where: { id: mediaId },
          data: { displayOrder: index },
        }),
      ),
    );

    const updated = await this.prisma.talentMedia.findMany({
      where: { talentId },
      include: { mediaAsset: true },
      orderBy: { displayOrder: "asc" },
    });

    return updated.map((item) =>
      toTalentMediaResponse(item, this.buildOptimizedUrl),
    );
  }

  /**
   * Arrow property (not a method) so it auto-binds `this` — passed directly
   * as a callback to the pure `toTalentResponse`/`toTalentMediaResponse`
   * mapping functions. Legacy assets (no `publicId`) fall back to their raw
   * stored `url`, same fallback `MediaService.buildVariants` uses.
   */
  private buildOptimizedUrl = (asset: {
    publicId: string | null;
    url: string;
  }): string =>
    asset.publicId
      ? this.cloudinary.buildOptimizedUrl(asset.publicId)
      : asset.url;

  /**
   * Rejects featuring more talent than the home page's Featured row can
   * show. `excludeId` is the talent being updated, so re-saving one that
   * is already featured doesn't count itself and trip the limit.
   */
  private async assertFeaturedSlotAvailable(excludeId?: string): Promise<void> {
    const featuredCount = await this.prisma.talent.count({
      where: {
        isFeatured: true,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (featuredCount >= MAX_FEATURED_TALENTS) {
      throw new ConflictException({
        code: "FEATURED_LIMIT_REACHED",
        message: `Only ${MAX_FEATURED_TALENTS} talents can be featured at a time. Unfeature another talent first.`,
      });
    }
  }

  private async findActiveTalentOrThrow(
    id: string,
  ): Promise<TalentWithRelations> {
    const talent = await this.prisma.talent.findFirst({
      where: { id, deletedAt: null },
      include: TALENT_INCLUDE,
    });
    if (!talent) {
      throw new NotFoundException({
        code: "TALENT_NOT_FOUND",
        message: "Talent not found.",
      });
    }
    return talent;
  }

  private async findTalentMediaOrThrow(talentId: string, mediaId: string) {
    const media = await this.prisma.talentMedia.findFirst({
      where: { id: mediaId, talentId },
    });
    if (!media) {
      throw new NotFoundException({
        code: "TALENT_MEDIA_NOT_FOUND",
        message: "Gallery image not found for this talent.",
      });
    }
    return media;
  }
}
