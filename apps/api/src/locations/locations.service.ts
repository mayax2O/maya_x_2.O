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
import { toLocationResponse, type LocationResponse } from "./location.response";
import type { CreateLocationDto } from "./dto/create-location.dto";
import type { ListLocationsQueryDto } from "./dto/list-locations.query.dto";
import type { UpdateLocationDto } from "./dto/update-location.dto";

const SORTABLE_FIELDS = new Set(["name", "displayOrder", "createdAt"]);

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLocationDto): Promise<LocationResponse> {
    try {
      const location = await this.prisma.location.create({
        data: {
          name: dto.name,
          cityId: dto.cityId,
          isActive: dto.isActive ?? true,
          displayOrder: dto.displayOrder ?? 0,
        },
        include: { city: true },
      });
      return toLocationResponse(location);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "LOCATION_CONFLICT",
          message: "A location with this name already exists in that city.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "CITY_NOT_FOUND",
          message: "The selected city does not exist.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: ListLocationsQueryDto,
  ): Promise<PaginatedResult<LocationResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.LocationWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    };

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "displayOrder";

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        include: { city: true },
        orderBy: { [sortBy]: query.sortOrder ?? "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.location.count({ where }),
    ]);

    return { items: rows.map(toLocationResponse), total };
  }

  async findOne(id: string): Promise<LocationResponse> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: { city: true },
    });
    if (!location) {
      throw new NotFoundException({
        code: "LOCATION_NOT_FOUND",
        message: "Location not found.",
      });
    }
    return toLocationResponse(location);
  }

  async update(id: string, dto: UpdateLocationDto): Promise<LocationResponse> {
    await this.findOne(id);

    try {
      const location = await this.prisma.location.update({
        where: { id },
        data: dto,
        include: { city: true },
      });
      return toLocationResponse(location);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "LOCATION_CONFLICT",
          message: "A location with this name already exists in that city.",
        });
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "CITY_NOT_FOUND",
          message: "The selected city does not exist.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.prisma.location.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyConstraintViolation(error)) {
        throw new ConflictException({
          code: "LOCATION_IN_USE",
          message:
            "This location is still referenced by talent and cannot be deleted.",
        });
      }
      throw error;
    }
  }

  async bulkAction(dto: BulkActionDto): Promise<BulkActionResult> {
    if (dto.action === "delete") {
      try {
        const result = await this.prisma.location.deleteMany({
          where: { id: { in: dto.ids } },
        });
        return { requested: dto.ids.length, affected: result.count };
      } catch (error) {
        if (isForeignKeyConstraintViolation(error)) {
          throw new ConflictException({
            code: "LOCATION_IN_USE",
            message:
              "One or more selected locations are still referenced by talent and cannot be deleted.",
          });
        }
        throw error;
      }
    }

    const result = await this.prisma.location.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: dto.action === "activate" },
    });
    return { requested: dto.ids.length, affected: result.count };
  }
}
