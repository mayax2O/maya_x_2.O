import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../database/prisma.service";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination-result.interface";
import { toAdminResponse, type AdminResponse } from "./admin.response";
import type { CreateAdminDto } from "./dto/create-admin.dto";
import type { UpdateAdminDto } from "./dto/update-admin.dto";

const BCRYPT_SALT_ROUNDS = 12;

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminDto): Promise<AdminResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      const admin = await this.prisma.admin.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          isActive: dto.isActive ?? true,
        },
      });
      return toAdminResponse(admin);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "ADMIN_EMAIL_CONFLICT",
          message: "An admin with this email already exists.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<AdminResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.admin.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.admin.count({ where: { deletedAt: null } }),
    ]);

    return { items: rows.map(toAdminResponse), total };
  }

  async findOne(id: string): Promise<AdminResponse> {
    const admin = await this.prisma.admin.findFirst({
      where: { id, deletedAt: null },
    });
    if (!admin) {
      throw new NotFoundException({
        code: "ADMIN_NOT_FOUND",
        message: "Admin not found.",
      });
    }
    return toAdminResponse(admin);
  }

  async update(id: string, dto: UpdateAdminDto): Promise<AdminResponse> {
    await this.findOne(id);

    const data: Prisma.AdminUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    }

    try {
      const admin = await this.prisma.admin.update({ where: { id }, data });
      return toAdminResponse(admin);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "ADMIN_EMAIL_CONFLICT",
          message: "An admin with this email already exists.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.admin.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
