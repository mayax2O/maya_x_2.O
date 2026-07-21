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

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import {
  BulkActionDto,
  type BulkActionResult,
} from "../common/dto/bulk-action.dto";
import { CreateTalentDto } from "./dto/create-talent.dto";
import { CreateTalentMediaDto } from "./dto/create-talent-media.dto";
import { ListTalentQueryDto } from "./dto/list-talent.query.dto";
import { ReorderTalentMediaDto } from "./dto/reorder-talent-media.dto";
import { UpdateTalentDto } from "./dto/update-talent.dto";
import type { TalentMediaResponse } from "./talent-media.response";
import { TalentService } from "./talent.service";
import type { TalentResponse } from "./talent.response";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("talent")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class TalentController {
  constructor(private readonly talentService: TalentService) {}

  @Post()
  async create(
    @Body() dto: CreateTalentDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<TalentResponse>> {
    const data = await this.talentService.create(dto, user.sub);
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListTalentQueryDto,
  ): Promise<ListEnvelope<TalentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.talentService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkAction(
    @Body() dto: BulkActionDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.talentService.bulkAction(dto);
    return { data };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<TalentResponse>> {
    const data = await this.talentService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTalentDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<TalentResponse>> {
    const data = await this.talentService.update(id, dto, user.sub);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.talentService.remove(id);
  }

  @Post(":id/media")
  async addMedia(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateTalentMediaDto,
  ): Promise<DataEnvelope<TalentMediaResponse>> {
    const data = await this.talentService.addMedia(id, dto);
    return { data };
  }

  @Patch(":id/media/reorder")
  async reorderMedia(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReorderTalentMediaDto,
  ): Promise<DataEnvelope<TalentMediaResponse[]>> {
    const data = await this.talentService.reorderMedia(id, dto);
    return { data };
  }

  @Patch(":id/media/:mediaId/primary")
  async setPrimaryMedia(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("mediaId", ParseUUIDPipe) mediaId: string,
  ): Promise<DataEnvelope<TalentMediaResponse>> {
    const data = await this.talentService.setPrimaryMedia(id, mediaId);
    return { data };
  }

  @Delete(":id/media/:mediaId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMedia(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("mediaId", ParseUUIDPipe) mediaId: string,
  ): Promise<void> {
    await this.talentService.removeMedia(id, mediaId);
  }
}
