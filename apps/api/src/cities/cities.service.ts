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
import { toCityResponse, type CityResponse } from "./city.response";
import type { CreateCityDto } from "./dto/create-city.dto";
import type { ListCitiesQueryDto } from "./dto/list-cities.query.dto";
import type { UpdateCityDto } from "./dto/update-city.dto";

const SORTABLE_FIELDS = new Set(["name", "state", "displayOrder", "createdAt"]);

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCityDto): Promise<CityResponse> {
    try {
      const city = await this.prisma.city.create({
        data: {
          name: dto.name,
          state: dto.state,
          isActive: dto.isActive ?? true,
          displayOrder: dto.displayOrder ?? 0,
        },
      });
      return toCityResponse(city);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "CITY_CONFLICT",
          message: "A city with this name already exists in that state.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListCitiesQueryDto,
  ): Promise<PaginatedResult<CityResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.CityWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { state: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "displayOrder";

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.city.findMany({
        where,
        orderBy: { [sortBy]: query.sortOrder ?? "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.city.count({ where }),
    ]);

    return { items: rows.map(toCityResponse), total };
  }

  async findOne(id: string): Promise<CityResponse> {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundException({
        code: "CITY_NOT_FOUND",
        message: "City not found.",
      });
    }
    return toCityResponse(city);
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityResponse> {
    await this.findOne(id);

    try {
      const city = await this.prisma.city.update({ where: { id }, data: dto });
      return toCityResponse(city);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "CITY_CONFLICT",
          message: "A city with this name already exists in that state.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.city.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "CITY_IN_USE",
          message:
            "This city is still referenced by locations or talent and cannot be deleted.",
        });
      }
      throw error;
    }
  }

  async bulkAction(dto: BulkActionDto): Promise<BulkActionResult> {
    if (dto.action === "delete") {
      try {
        const result = await this.prisma.city.deleteMany({
          where: { id: { in: dto.ids } },
        });
        return { requested: dto.ids.length, affected: result.count };
      } catch (error) {
        if (isForeignKeyConstraintViolation(error)) {
          throw new ConflictException({
            code: "CITY_IN_USE",
            message:
              "One or more selected cities are still referenced by locations or talent and cannot be deleted.",
          });
        }
        throw error;
      }
    }

    const result = await this.prisma.city.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: dto.action === "activate" },
    });
    return { requested: dto.ids.length, affected: result.count };
  }
}
