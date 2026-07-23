import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { PrismaService } from "../database/prisma.service";
import { HeroModeDto } from "./dto/update-hero-settings.dto";
import { HeroService } from "./hero.service";

const HERO_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

function createPrismaMock() {
  const prisma = {
    heroSettings: { findUnique: jest.fn(), upsert: jest.fn() },
    mediaAsset: { findMany: jest.fn(), count: jest.fn() },
    mediaUsage: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: unknown) => unknown) => callback(prisma),
  );
  return prisma;
}

describe("HeroService", () => {
  let service: HeroService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [HeroService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(HeroService);
  });

  describe("getSettings", () => {
    it("returns an empty media list when no row exists yet", async () => {
      prisma.heroSettings.findUnique.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result).toEqual({ mode: "image", media: [] });
      expect(prisma.mediaAsset.findMany).not.toHaveBeenCalled();
    });

    it("hydrates media in the configured order, not findMany's order", async () => {
      prisma.heroSettings.findUnique.mockResolvedValue({
        id: HERO_SETTINGS_ID,
        mode: "slider",
        mediaIds: ["m2", "m1"],
      });
      prisma.mediaAsset.findMany.mockResolvedValue([
        { id: "m1", url: "u1", resourceType: "image", altText: null },
        { id: "m2", url: "u2", resourceType: "image", altText: null },
      ]);

      const result = await service.getSettings();

      expect(result.media.map((m) => m.id)).toEqual(["m2", "m1"]);
    });
  });

  describe("updateSettings", () => {
    it("rejects when a mediaId doesn't exist", async () => {
      prisma.mediaAsset.count.mockResolvedValue(1);

      await expect(
        service.updateSettings(
          { mode: HeroModeDto.image, mediaIds: ["m1", "m2"] },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.heroSettings.upsert).not.toHaveBeenCalled();
    });

    it("rejects more than one media item outside slider mode", async () => {
      prisma.mediaAsset.count.mockResolvedValue(2);

      await expect(
        service.updateSettings(
          { mode: HeroModeDto.video, mediaIds: ["m1", "m2"] },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("replaces MediaUsage rows and upserts the singleton on success", async () => {
      prisma.mediaAsset.count.mockResolvedValue(2);
      prisma.heroSettings.findUnique.mockResolvedValue({
        id: HERO_SETTINGS_ID,
        mode: "slider",
        mediaIds: ["m1", "m2"],
      });
      prisma.mediaAsset.findMany.mockResolvedValue([
        { id: "m1", url: "u1", resourceType: "image", altText: null },
        { id: "m2", url: "u2", resourceType: "image", altText: null },
      ]);

      await service.updateSettings(
        { mode: HeroModeDto.slider, mediaIds: ["m1", "m2"] },
        "admin-1",
      );

      expect(prisma.mediaUsage.deleteMany).toHaveBeenCalledWith({
        where: { entityType: "hero_settings", entityId: HERO_SETTINGS_ID },
      });
      expect(prisma.mediaUsage.createMany).toHaveBeenCalledWith({
        data: [
          {
            mediaAssetId: "m1",
            entityType: "hero_settings",
            entityId: HERO_SETTINGS_ID,
          },
          {
            mediaAssetId: "m2",
            entityType: "hero_settings",
            entityId: HERO_SETTINGS_ID,
          },
        ],
      });
      expect(prisma.heroSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: HERO_SETTINGS_ID },
          create: expect.objectContaining({ mode: "slider" }),
          update: expect.objectContaining({ mode: "slider" }),
        }),
      );
    });
  });
});
