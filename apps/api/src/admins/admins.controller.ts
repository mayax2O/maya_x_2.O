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
import { AdminsService } from "./admins.service";
import type { AdminResponse } from "./admin.response";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("admins")
@UseFilters(DomainHttpExceptionFilter)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  async create(
    @Body() dto: CreateAdminDto,
  ): Promise<DataEnvelope<AdminResponse>> {
    const data = await this.adminsService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<ListEnvelope<AdminResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.adminsService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<AdminResponse>> {
    const data = await this.adminsService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
  ): Promise<DataEnvelope<AdminResponse>> {
    const data = await this.adminsService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.adminsService.remove(id);
  }
}
