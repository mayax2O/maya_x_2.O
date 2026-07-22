import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { CLOUDINARY_GATEWAY } from "../media/cloudinary-gateway.interface";
import { TalentService } from "./talent.service";

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

function createForeignKeyError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    "Foreign key constraint failed",
    {
      code: "P2003",
      clientVersion: "5.22.0",
    },
  );
}

const cityRow = { id: "city-1", name: "Kolkata", state: "West Bengal" };

function makeTalentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "talent-1",
    displayName: "Ananya Rao",
    slug: "ananya-rao",
    tagline: "Event Host",
    bio: null,
    age: 29,
    cityId: "city-1",
    locationId: null,
    languages: ["English"],
    heightCm: null,
    bodyType: null,
    currency: "INR",
    basePrice: new Prisma.Decimal(25000),
    hourlyRate: null,
    overnightRate: null,
    weekendRate: null,
    customPricingNotes: null,
    availability: "available",
    verificationStatus: "pending",
    isPremium: false,
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
    createdAt: new Date("2026-07-21T00:00:00Z"),
    updatedAt: new Date("2026-07-21T00:00:00Z"),
    deletedAt: null,
    city: cityRow,
    location: null,
    categories: [],
    media: [],
    ...overrides,
  };
}

describe("TalentService", () => {
  let service: TalentService;
  let prisma: {
    talent: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    talentCategoryMap: { deleteMany: jest.Mock; createMany: jest.Mock };
    talentMedia: {
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
    mediaAsset: { findFirst: jest.Mock };
    mediaUsage: { create: jest.Mock; deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      talent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      talentCategoryMap: { deleteMany: jest.fn(), createMany: jest.fn() },
      talentMedia: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      mediaAsset: { findFirst: jest.fn() },
      mediaUsage: { create: jest.fn(), deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    // Default: interactive-transaction form hands back `prisma` as `tx`;
    // array form resolves each promise/array-item as given.
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return arg(prisma);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TalentService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CLOUDINARY_GATEWAY,
          useValue: {
            uploadAsset: jest.fn(),
            deleteAsset: jest.fn(),
            buildOptimizedUrl: jest.fn(
              (publicId: string) => `optimized:${publicId}`,
            ),
            buildVariantUrls: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TalentService);
  });

  describe("create", () => {
    it("auto-derives the slug and links categories", async () => {
      prisma.talent.create.mockResolvedValue(makeTalentRow());

      const result = await service.create(
        {
          displayName: "Ananya Rao",
          cityId: "city-1",
          basePrice: 25000,
          categoryIds: ["cat-1", "cat-2"],
        },
        "admin-1",
      );

      const callArgs = prisma.talent.create.mock.calls[0][0];
      expect(callArgs.data.slug).toBe("ananya-rao");
      expect(callArgs.data.createdBy).toBe("admin-1");
      expect(callArgs.data.categories).toEqual({
        create: [{ categoryId: "cat-1" }, { categoryId: "cat-2" }],
      });
      expect(result.pricing.basePrice).toBe(25000);
    });

    it("maps a duplicate slug to 409 Conflict", async () => {
      prisma.talent.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.create(
          { displayName: "Ananya Rao", cityId: "city-1", basePrice: 25000 },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("maps an invalid city/location/category reference to 400", async () => {
      prisma.talent.create.mockRejectedValue(createForeignKeyError());

      await expect(
        service.create(
          { displayName: "Ananya Rao", cityId: "missing", basePrice: 25000 },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("excludes soft-deleted talent and paginates", async () => {
      prisma.$transaction.mockResolvedValue([[makeTalentRow()], 1]);

      const result = await service.findAll({
        page: 1,
        perPage: 20,
        sortOrder: "asc",
      });

      expect(result.total).toBe(1);
      expect(result.items[0]?.displayName).toBe("Ananya Rao");
    });
  });

  describe("findOne / update / remove", () => {
    it("throws NotFoundException when missing or soft-deleted", async () => {
      prisma.talent.findFirst.mockResolvedValue(null);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("replaces category links when categoryIds is provided", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.talent.update.mockResolvedValue(
        makeTalentRow({ displayName: "Updated Name" }),
      );

      await service.update(
        "talent-1",
        { displayName: "Updated Name", categoryIds: ["cat-3"] },
        "admin-1",
      );

      expect(prisma.talentCategoryMap.deleteMany).toHaveBeenCalledWith({
        where: { talentId: "talent-1" },
      });
      expect(prisma.talentCategoryMap.createMany).toHaveBeenCalledWith({
        data: [{ talentId: "talent-1", categoryId: "cat-3" }],
      });
    });

    it("soft-deletes by setting deletedAt", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.talent.update.mockResolvedValue(
        makeTalentRow({ deletedAt: new Date() }),
      );

      await service.remove("talent-1");

      expect(prisma.talent.update).toHaveBeenCalledWith({
        where: { id: "talent-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("bulkAction", () => {
    it("soft-deletes the given ids (not a hard delete)", async () => {
      prisma.talent.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAction({
        ids: ["a", "b"],
        action: "delete",
      });

      expect(prisma.talent.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["a", "b"] }, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ requested: 2, affected: 2 });
    });
  });

  describe("media", () => {
    const mediaAssetRow = {
      id: "asset-1",
      url: "https://res.cloudinary.com/demo/image/upload/a.jpg",
      altText: "Photo",
      resourceType: "image",
    };

    it("makes the first uploaded image primary by default", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.mediaAsset.findFirst.mockResolvedValue(mediaAssetRow);
      prisma.talentMedia.count.mockResolvedValue(0);
      prisma.talentMedia.create.mockResolvedValue({
        id: "media-1",
        mediaAssetId: "asset-1",
        isPrimary: true,
        displayOrder: 0,
        mediaAsset: mediaAssetRow,
      });
      prisma.mediaUsage.create.mockResolvedValue({});

      const result = await service.addMedia("talent-1", {
        mediaAssetId: "asset-1",
      });

      expect(result.isPrimary).toBe(true);
      expect(prisma.mediaUsage.create).toHaveBeenCalledWith({
        data: {
          mediaAssetId: "asset-1",
          entityType: "talent_gallery",
          entityId: "talent-1",
        },
      });
    });

    it("unsets other primaries when a new image is explicitly marked primary", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.mediaAsset.findFirst.mockResolvedValue(mediaAssetRow);
      prisma.talentMedia.count.mockResolvedValue(2);
      prisma.talentMedia.create.mockResolvedValue({
        id: "media-3",
        mediaAssetId: "asset-1",
        isPrimary: true,
        displayOrder: 2,
        mediaAsset: mediaAssetRow,
      });
      prisma.mediaUsage.create.mockResolvedValue({});

      await service.addMedia("talent-1", {
        mediaAssetId: "asset-1",
        isPrimary: true,
      });

      expect(prisma.talentMedia.updateMany).toHaveBeenCalledWith({
        where: { talentId: "talent-1" },
        data: { isPrimary: false },
      });
    });

    it("rejects adding a media asset that doesn't exist", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.mediaAsset.findFirst.mockResolvedValue(null);

      await expect(
        service.addMedia("talent-1", { mediaAssetId: "missing" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("promotes the next image to primary after the primary image is removed", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.talentMedia.findFirst
        .mockResolvedValueOnce({
          id: "media-1",
          mediaAssetId: "asset-1",
          isPrimary: true,
        }) // findTalentMediaOrThrow
        .mockResolvedValueOnce({ id: "media-2", displayOrder: 1 }); // next-primary lookup
      prisma.talentMedia.delete.mockResolvedValue({});
      prisma.talentMedia.update.mockResolvedValue({});
      prisma.mediaUsage.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeMedia("talent-1", "media-1");

      expect(prisma.talentMedia.delete).toHaveBeenCalledWith({
        where: { id: "media-1" },
      });
      expect(prisma.mediaUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          mediaAssetId: "asset-1",
          entityType: "talent_gallery",
          entityId: "talent-1",
        },
      });
      expect(prisma.talentMedia.update).toHaveBeenCalledWith({
        where: { id: "media-2" },
        data: { isPrimary: true },
      });
    });

    it("rejects reordering when mediaIds doesn't match the gallery's current ids", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.talentMedia.findMany.mockResolvedValue([
        { id: "media-1" },
        { id: "media-2" },
      ]);

      await expect(
        service.reorderMedia("talent-1", { mediaIds: ["media-1"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("reorders media according to the given sequence", async () => {
      prisma.talent.findFirst.mockResolvedValue(makeTalentRow());
      prisma.talentMedia.findMany
        .mockResolvedValueOnce([{ id: "media-1" }, { id: "media-2" }])
        .mockResolvedValueOnce([
          {
            id: "media-2",
            mediaAssetId: "asset-2",
            isPrimary: false,
            displayOrder: 0,
            mediaAsset: { ...mediaAssetRow, id: "asset-2" },
          },
          {
            id: "media-1",
            mediaAssetId: "asset-1",
            isPrimary: true,
            displayOrder: 1,
            mediaAsset: mediaAssetRow,
          },
        ]);
      prisma.talentMedia.update.mockResolvedValue({});

      const result = await service.reorderMedia("talent-1", {
        mediaIds: ["media-2", "media-1"],
      });

      expect(result.map((item) => item.id)).toEqual(["media-2", "media-1"]);
    });
  });
});
