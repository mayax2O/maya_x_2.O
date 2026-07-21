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
  UseGuards,
} from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import {
  BulkActionDto,
  type BulkActionResult,
} from "../common/dto/bulk-action.dto";
import { CreateTalentCategoryDto } from "./dto/create-talent-category.dto";
import { ListTalentCategoriesQueryDto } from "./dto/list-talent-categories.query.dto";
import { UpdateTalentCategoryDto } from "./dto/update-talent-category.dto";
import { TalentCategoriesService } from "./talent-categories.service";
import type { TalentCategoryResponse } from "./talent-category.response";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("talent-categories")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class TalentCategoriesController {
  constructor(private readonly categoriesService: TalentCategoriesService) {}

  @Post()
  async create(
    @Body() dto: CreateTalentCategoryDto,
  ): Promise<DataEnvelope<TalentCategoryResponse>> {
    const data = await this.categoriesService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListTalentCategoriesQueryDto,
  ): Promise<ListEnvelope<TalentCategoryResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.categoriesService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkAction(
    @Body() dto: BulkActionDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.categoriesService.bulkAction(dto);
    return { data };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<TalentCategoryResponse>> {
    const data = await this.categoriesService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTalentCategoryDto,
  ): Promise<DataEnvelope<TalentCategoryResponse>> {
    const data = await this.categoriesService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
