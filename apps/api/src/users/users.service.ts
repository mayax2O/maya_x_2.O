import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination-result.interface";
import { toUserResponse, type UserResponse } from "./user.response";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone,
        },
      });
      return toUserResponse(user);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "USER_EMAIL_CONFLICT",
          message: "A user with this email already exists.",
        });
      }
      throw error;
    }
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return { items: rows.map(toUserResponse), total };
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }
    return toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone;

    try {
      const user = await this.prisma.user.update({ where: { id }, data });
      return toUserResponse(user);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "USER_EMAIL_CONFLICT",
          message: "A user with this email already exists.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
