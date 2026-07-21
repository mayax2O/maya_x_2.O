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
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLocationsQueryDto } from "./dto/list-locations.query.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { LocationsService } from "./locations.service";
import type { LocationResponse } from "./location.response";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("locations")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async create(
    @Body() dto: CreateLocationDto,
  ): Promise<DataEnvelope<LocationResponse>> {
    const data = await this.locationsService.create(dto);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListLocationsQueryDto,
  ): Promise<ListEnvelope<LocationResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.locationsService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkAction(
    @Body() dto: BulkActionDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.locationsService.bulkAction(dto);
    return { data };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<LocationResponse>> {
    const data = await this.locationsService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<DataEnvelope<LocationResponse>> {
    const data = await this.locationsService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.locationsService.remove(id);
  }
}
