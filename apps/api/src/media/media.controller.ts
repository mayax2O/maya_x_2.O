import {
  BadRequestException,
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
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { BulkDeleteMediaDto } from "./dto/bulk-delete-media.dto";
import { BulkMoveMediaDto } from "./dto/bulk-move-media.dto";
import { CreateFolderDto } from "./dto/create-folder.dto";
import { ListMediaQueryDto } from "./dto/list-media.query.dto";
import { ReorderMediaDto } from "./dto/reorder-media.dto";
import { UpdateFolderDto } from "./dto/update-folder.dto";
import { UpdateMediaDto } from "./dto/update-media.dto";
import type { MediaAssetResponse } from "./media-asset.response";
import type { MediaFolderResponse } from "./media-folder.response";
import { MediaService, type BulkActionResult } from "./media.service";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

// Stricter than the app-wide default (see main.ts / ThrottlerModule) —
// uploads are the most expensive request this API handles.
const UPLOAD_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

@Controller("media")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @Throttle(UPLOAD_THROTTLE)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("folderId") folderId: string | undefined,
    @Body("altText") altText: string | undefined,
  ): Promise<DataEnvelope<MediaAssetResponse>> {
    if (!file) {
      throw new BadRequestException({
        code: "MEDIA_FILE_REQUIRED",
        message: "A file is required.",
      });
    }
    const data = await this.mediaService.upload({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalFilename: file.originalname,
      folderId: folderId || undefined,
      altText: altText || undefined,
    });
    return { data };
  }

  @Get()
  async findAll(
    @Query() query: ListMediaQueryDto,
  ): Promise<ListEnvelope<MediaAssetResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 24;
    const { items, total } = await this.mediaService.findAll(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  async reorder(
    @Body("folderId") folderId: string | undefined,
    @Body() dto: ReorderMediaDto,
  ): Promise<DataEnvelope<MediaAssetResponse[]>> {
    const data = await this.mediaService.reorder(folderId || undefined, dto);
    return { data };
  }

  @Post("bulk-delete")
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @Body() dto: BulkDeleteMediaDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.mediaService.bulkDelete(dto);
    return { data };
  }

  @Post("bulk-move")
  @HttpCode(HttpStatus.OK)
  async bulkMove(
    @Body() dto: BulkMoveMediaDto,
  ): Promise<DataEnvelope<BulkActionResult>> {
    const data = await this.mediaService.bulkMove(dto);
    return { data };
  }

  @Get("folders")
  async findAllFolders(): Promise<DataEnvelope<MediaFolderResponse[]>> {
    const data = await this.mediaService.findAllFolders();
    return { data };
  }

  @Post("folders")
  async createFolder(
    @Body() dto: CreateFolderDto,
  ): Promise<DataEnvelope<MediaFolderResponse>> {
    const data = await this.mediaService.createFolder(dto);
    return { data };
  }

  @Patch("folders/:id")
  async updateFolder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ): Promise<DataEnvelope<MediaFolderResponse>> {
    const data = await this.mediaService.updateFolder(id, dto);
    return { data };
  }

  @Delete("folders/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFolder(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.mediaService.removeFolder(id);
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DataEnvelope<MediaAssetResponse>> {
    const data = await this.mediaService.findOne(id);
    return { data };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<DataEnvelope<MediaAssetResponse>> {
    const data = await this.mediaService.update(id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.mediaService.remove(id);
  }

  @Post(":id/replace")
  @Throttle(UPLOAD_THROTTLE)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async replace(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DataEnvelope<MediaAssetResponse>> {
    if (!file) {
      throw new BadRequestException({
        code: "MEDIA_FILE_REQUIRED",
        message: "A file is required.",
      });
    }
    const data = await this.mediaService.replace(id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalFilename: file.originalname,
    });
    return { data };
  }
}
