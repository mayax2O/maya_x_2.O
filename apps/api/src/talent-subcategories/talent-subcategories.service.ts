import {
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
import type { CreateTalentSubCategoryDto } from "./dto/create-talent-subcategory.dto";
import type { ListTalentSubCategoriesQueryDto } from "./dto/list-talent-subcategories.query.dto";
import type { UpdateTalentSubCategoryDto } from "./dto/update-talent-subcategory.dto";
import {
  toTalentSubCategoryResponse,
  type TalentSubCategoryResponse,
} from "./talent-subcategory.response";

const SORTABLE_FIELDS = new Set(["name", "displayOrder"]);

@Injectable()
export class TalentSubCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTalentSubCategoryDto,
  ): Promise<TalentSubCategoryResponse> {
    try {
      const subCategory = await this.prisma.talentSubCategory.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug: dto.slug ?? slugify(dto.name),
          isActive: true,
          displayOrder: dto.displayOrder ?? 0,
        },
      });
      return toTalentSubCategoryResponse(subCategory);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "SUBCATEGORY_CONFLICT",
          message: "A sub-category with this slug already exists.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new NotFoundException({
          code: "CATEGORY_NOT_FOUND",
          message: "The selected category does not exist.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListTalentSubCategoriesQueryDto,
  ): Promise<PaginatedResult<TalentSubCategoryResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.TalentSubCategoryWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    };

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "displayOrder";

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.talentSubCategory.findMany({
        where,
        orderBy: { [sortBy]: query.sortOrder ?? "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.talentSubCategory.count({ where }),
    ]);

    return { items: rows.map(toTalentSubCategoryResponse), total };
  }

  async findOne(id: string): Promise<TalentSubCategoryResponse> {
    const subCategory = await this.prisma.talentSubCategory.findUnique({
      where: { id },
    });
    if (!subCategory) {
      throw new NotFoundException({
        code: "SUBCATEGORY_NOT_FOUND",
        message: "Sub-category not found.",
      });
    }
    return toTalentSubCategoryResponse(subCategory);
  }

  async update(
    id: string,
    dto: UpdateTalentSubCategoryDto,
  ): Promise<TalentSubCategoryResponse> {
    await this.findOne(id);

    try {
      const subCategory = await this.prisma.talentSubCategory.update({
        where: { id },
        data: dto,
      });
      return toTalentSubCategoryResponse(subCategory);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "SUBCATEGORY_CONFLICT",
          message: "A sub-category with this slug already exists.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new NotFoundException({
          code: "CATEGORY_NOT_FOUND",
          message: "The selected category does not exist.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.talentSubCategory.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "SUBCATEGORY_IN_USE",
          message:
            "This sub-category is still assigned to talent and cannot be deleted.",
        });
      }
      throw error;
    }
  }

  async bulkAction(dto: BulkActionDto): Promise<BulkActionResult> {
    if (dto.action === "delete") {
      try {
        const result = await this.prisma.talentSubCategory.deleteMany({
          where: { id: { in: dto.ids } },
        });
        return { requested: dto.ids.length, affected: result.count };
      } catch (error) {
        if (isForeignKeyConstraintViolation(error)) {
          throw new ConflictException({
            code: "SUBCATEGORY_IN_USE",
            message:
              "One or more selected sub-categories are still assigned to talent and cannot be deleted.",
          });
        }
        throw error;
      }
    }

    const result = await this.prisma.talentSubCategory.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: dto.action === "activate" },
    });
    return { requested: dto.ids.length, affected: result.count };
  }
}
