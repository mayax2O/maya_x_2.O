import { BadRequestException, Injectable } from "@nestjs/common";
import type { MediaAsset } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import type { UpdateHeroSettingsDto } from "./dto/update-hero-settings.dto";
import { toHeroMediaItem, type HeroSettingsResponse } from "./hero.response";

// Fixed, well-known id for the one HeroSettings row this app ever reads or
// writes — see the model comment in schema.prisma. Avoids a lookup just to
// find "the" row, and makes the upsert in updateSettings() unambiguous.
const HERO_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
// MediaUsage.entityType for Hero's media selections, so the Media Library's
// "used in N places" count and delete-blocking logic cover Hero too.
const HERO_USAGE_TYPE = "hero_settings";

@Injectable()
export class HeroService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<HeroSettingsResponse> {
    const settings = await this.prisma.heroSettings.findUnique({
      where: { id: HERO_SETTINGS_ID },
    });

    if (!settings || settings.mediaIds.length === 0) {
      return { mode: settings?.mode ?? "image", media: [] };
    }

    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: settings.mediaIds }, deletedAt: null },
    });
    const byId = new Map(assets.map((asset) => [asset.id, asset]));

    // Preserve the configured order (matters for slider mode) — findMany
    // doesn't guarantee result order matches the `in` list.
    const media = settings.mediaIds
      .map((id) => byId.get(id))
      .filter((asset): asset is MediaAsset => Boolean(asset))
      .map(toHeroMediaItem);

    return { mode: settings.mode, media };
  }

  async updateSettings(
    dto: UpdateHeroSettingsDto,
    adminId: string,
  ): Promise<HeroSettingsResponse> {
    if (dto.mediaIds.length > 0) {
      const count = await this.prisma.mediaAsset.count({
        where: { id: { in: dto.mediaIds }, deletedAt: null },
      });
      if (count !== new Set(dto.mediaIds).size) {
        throw new BadRequestException({
          code: "HERO_MEDIA_NOT_FOUND",
          message: "One or more selected media items do not exist.",
        });
      }
    }
    if (dto.mode !== "slider" && dto.mediaIds.length > 1) {
      throw new BadRequestException({
        code: "HERO_MEDIA_TOO_MANY",
        message: "Image and video mode accept exactly one media item.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaUsage.deleteMany({
        where: { entityType: HERO_USAGE_TYPE, entityId: HERO_SETTINGS_ID },
      });
      if (dto.mediaIds.length > 0) {
        await tx.mediaUsage.createMany({
          data: dto.mediaIds.map((mediaAssetId) => ({
            mediaAssetId,
            entityType: HERO_USAGE_TYPE,
            entityId: HERO_SETTINGS_ID,
          })),
        });
      }
      await tx.heroSettings.upsert({
        where: { id: HERO_SETTINGS_ID },
        create: {
          id: HERO_SETTINGS_ID,
          mode: dto.mode,
          mediaIds: dto.mediaIds,
          updatedBy: adminId,
        },
        update: {
          mode: dto.mode,
          mediaIds: dto.mediaIds,
          updatedBy: adminId,
        },
      });
    });

    return this.getSettings();
  }
}
