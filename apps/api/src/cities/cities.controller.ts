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
import { CitiesService } from "./cities.service";
import type { CityResponse } from "./city.response";
import { CreateCityDto } from "./dto/create-city.dto";
import { ListCitiesQueryDto } from "./dto/list-cities.query.dto";
import { UpdateCityDto } from "./dto/update-city.dto";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("cities")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  async create(
    @Body() dto: CreateCityDto,
  ): Promise<DataEnvelope<CityResponse>> {
    const data = await this.citiesService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListCitiesQueryDto,
  ): Promise<ListEnvelope<CityResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.citiesService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkAction(
    @Body() dto: BulkActionDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.citiesService.bulkAction(dto);
    return { data };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<CityResponse>> {
    const data = await this.citiesService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto,
  ): Promise<DataEnvelope<CityResponse>> {
    const data = await this.citiesService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.citiesService.remove(id);
  }
}
