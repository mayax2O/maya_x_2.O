import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from "@nestjs/common";

import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { UsersService } from "./users.service";
import type { UserResponse } from "./user.response";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("users")
@UseFilters(DomainHttpExceptionFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() dto: CreateUserDto,
  ): Promise<DataEnvelope<UserResponse>> {
    const data = await this.usersService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<ListEnvelope<UserResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.usersService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<UserResponse>> {
    const data = await this.usersService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<DataEnvelope<UserResponse>> {
    const data = await this.usersService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
