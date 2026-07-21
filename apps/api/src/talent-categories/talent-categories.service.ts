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
import type { CreateTalentCategoryDto } from "./dto/create-talent-category.dto";
import type { ListTalentCategoriesQueryDto } from "./dto/list-talent-categories.query.dto";
import type { UpdateTalentCategoryDto } from "./dto/update-talent-category.dto";
import {
  toTalentCategoryResponse,
  type TalentCategoryResponse,
} from "./talent-category.response";

const SORTABLE_FIELDS = new Set(["name", "displayOrder"]);

@Injectable()
export class TalentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalentCategoryDto): Promise<TalentCategoryResponse> {
    try {
      const category = await this.prisma.talentCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug ?? slugify(dto.name),
          isActive: true,
          displayOrder: dto.displayOrder ?? 0,
        },
      });
      return toTalentCategoryResponse(category);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "CATEGORY_CONFLICT",
          message: "A category with this slug already exists.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListTalentCategoriesQueryDto,
  ): Promise<PaginatedResult<TalentCategoryResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.TalentCategoryWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    };

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "displayOrder";

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.talentCategory.findMany({
        where,
        orderBy: { [sortBy]: query.sortOrder ?? "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.talentCategory.count({ where }),
    ]);

    return { items: rows.map(toTalentCategoryResponse), total };
  }

  async findOne(id: string): Promise<TalentCategoryResponse> {
    const category = await this.prisma.talentCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      });
    }
    return toTalentCategoryResponse(category);
  }

  async update(
    id: string,
    dto: UpdateTalentCategoryDto,
  ): Promise<TalentCategoryResponse> {
    await this.findOne(id);

    try {
      const category = await this.prisma.talentCategory.update({
        where: { id },
        data: dto,
      });
      return toTalentCategoryResponse(category);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "CATEGORY_CONFLICT",
          message: "A category with this slug already exists.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.talentCategory.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "CATEGORY_IN_USE",
          message:
            "This category is still assigned to talent and cannot be deleted.",
        });
      }
      throw error;
    }
  }

  async bulkAction(dto: BulkActionDto): Promise<BulkActionResult> {
    if (dto.action === "delete") {
      try {
        const result = await this.prisma.talentCategory.deleteMany({
          where: { id: { in: dto.ids } },
        });
        return { requested: dto.ids.length, affected: result.count };
      } catch (error) {
        if (isForeignKeyConstraintViolation(error)) {
          throw new ConflictException({
            code: "CATEGORY_IN_USE",
            message:
              "One or more selected categories are still assigned to talent and cannot be deleted.",
          });
        }
        throw error;
      }
    }

    const result = await this.prisma.talentCategory.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: dto.action === "activate" },
    });
    return { requested: dto.ids.length, affected: result.count };
  }
}
