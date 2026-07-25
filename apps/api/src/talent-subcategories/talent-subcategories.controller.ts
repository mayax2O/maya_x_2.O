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
import { CreateTalentSubCategoryDto } from "./dto/create-talent-subcategory.dto";
import { ListTalentSubCategoriesQueryDto } from "./dto/list-talent-subcategories.query.dto";
import { UpdateTalentSubCategoryDto } from "./dto/update-talent-subcategory.dto";
import { TalentSubCategoriesService } from "./talent-subcategories.service";
import type { TalentSubCategoryResponse } from "./talent-subcategory.response";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("talent-subcategories")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class TalentSubCategoriesController {
  constructor(
    private readonly subCategoriesService: TalentSubCategoriesService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTalentSubCategoryDto,
  ): Promise<DataEnvelope<TalentSubCategoryResponse>> {
    const data = await this.subCategoriesService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListTalentSubCategoriesQueryDto,
  ): Promise<ListEnvelope<TalentSubCategoryResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.subCategoriesService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkAction(
    @Body() dto: BulkActionDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.subCategoriesService.bulkAction(dto);
    return { data };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<TalentSubCategoryResponse>> {
    const data = await this.subCategoriesService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTalentSubCategoryDto,
  ): Promise<DataEnvelope<TalentSubCategoryResponse>> {
    const data = await this.subCategoriesService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.subCategoriesService.remove(id);
  }
}
