import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

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
import type { ListTalentQueryDto } from "./dto/list-talent.query.dto";
import type { ReorderTalentMediaDto } from "./dto/reorder-talent-media.dto";
import type { UpdateTalentDto } from "./dto/update-talent.dto";
import {
  toTalentMediaResponse,
  type TalentMediaResponse,
} from "./talent-media.response";
import {
  toTalentResponse,
  type TalentResponse,
  type TalentWithRelations,
} from "./talent.response";

const TALENT_INCLUDE = {
  city: true,
  location: true,
  categories: { include: { category: true } },
  media: { include: { mediaAsset: true } },
} satisfies Prisma.TalentInclude;

// TalentMedia (M4) migrated to reference the M6 Media Library's MediaAsset
// instead of storing its own url/alt. Usage tracking lives in MediaUsage
// (entityType "talent_gallery", entityId = talentId) so the Media Library
// can show accurate "used in N places" counts and refuse to delete an
// in-use asset.
const TALENT_GALLERY_USAGE_TYPE = "talent_gallery";

const SORTABLE_FIELDS = new Set([
  "displayName",
  "basePrice",
  "displayOrder",
  "createdAt",
  "age",
]);

@Injectable()
export class TalentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalentDto, adminId: string): Promise<TalentResponse> {
    const { categoryIds, ...rest } = dto;

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
          bodyType: rest.bodyType,
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
        },
        include: TALENT_INCLUDE,
      });
      return toTalentResponse(talent);
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

    return { items: rows.map(toTalentResponse), total };
  }

  async findOne(id: string): Promise<TalentResponse> {
    const talent = await this.findActiveTalentOrThrow(id);
    return toTalentResponse(talent);
  }

  async update(
    id: string,
    dto: UpdateTalentDto,
    adminId: string,
  ): Promise<TalentResponse> {
    await this.findActiveTalentOrThrow(id);
    const { categoryIds, ...rest } = dto;

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

        return tx.talent.update({
          where: { id },
          data: { ...rest, updatedBy: adminId },
          include: TALENT_INCLUDE,
        });
      });
      return toTalentResponse(talent);
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

      return toTalentMediaResponse(media);
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
    return toTalentMediaResponse(media);
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

    return updated.map(toTalentMediaResponse);
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
