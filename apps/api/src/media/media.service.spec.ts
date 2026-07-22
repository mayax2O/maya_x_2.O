import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { CLOUDINARY_GATEWAY } from "./cloudinary-gateway.interface";
import { MediaService } from "./media.service";

// A minimal valid 1x1 transparent PNG — real magic bytes + IHDR chunk so
// `image-size` can parse real width/height (1x1) without needing a fixture file.
const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function makeAssetRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "asset-1",
    folderId: null,
    publicId: "maya-x/abc123",
    url: "https://res.cloudinary.com/demo/image/upload/abc123.jpg",
    format: "jpg",
    resourceType: "image",
    bytes: 1234,
    width: 800,
    height: 600,
    contentHash: "hash-1",
    originalFilename: "photo.jpg",
    altText: "A photo",
    displayOrder: 0,
    source: "cloudinary",
    createdBy: null,
    createdAt: new Date("2026-07-22T00:00:00Z"),
    updatedAt: new Date("2026-07-22T00:00:00Z"),
    deletedAt: null,
    ...overrides,
  };
}

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

describe("MediaService", () => {
  let service: MediaService;
  let prisma: {
    mediaAsset: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    mediaFolder: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    mediaUsage: { count: jest.Mock; groupBy: jest.Mock };
    $transaction: jest.Mock;
  };
  let gateway: {
    uploadAsset: jest.Mock;
    deleteAsset: jest.Mock;
    buildOptimizedUrl: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      mediaAsset: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      mediaFolder: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mediaUsage: { count: jest.fn(), groupBy: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return arg(prisma);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    });
    prisma.mediaUsage.count.mockResolvedValue(0);
    prisma.mediaUsage.groupBy.mockResolvedValue([]);

    gateway = {
      uploadAsset: jest.fn(),
      deleteAsset: jest.fn().mockResolvedValue(undefined),
      buildOptimizedUrl: jest.fn((publicId: string) => `optimized:${publicId}`),
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === "MEDIA_MAX_UPLOAD_BYTES") return 10 * 1024 * 1024;
        if (key === "MEDIA_MAX_DIMENSION_PX") return 8000;
        return undefined;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        { provide: CLOUDINARY_GATEWAY, useValue: gateway },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(MediaService);
  });

  describe("upload", () => {
    it("rejects unsupported mime types before touching Cloudinary", async () => {
      await expect(
        service.upload({
          buffer: ONE_PX_PNG,
          mimetype: "image/gif",
          originalFilename: "a.gif",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(gateway.uploadAsset).not.toHaveBeenCalled();
    });

    it("rejects files over the configured size limit", async () => {
      const oversized = Buffer.concat([
        ONE_PX_PNG,
        Buffer.alloc(11 * 1024 * 1024),
      ]);
      await expect(
        service.upload({
          buffer: oversized,
          mimetype: "image/png",
          originalFilename: "a.png",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(gateway.uploadAsset).not.toHaveBeenCalled();
    });

    it("returns the existing asset instead of re-uploading a duplicate", async () => {
      const existing = makeAssetRow();
      prisma.mediaAsset.findUnique.mockResolvedValue(existing);

      const result = await service.upload({
        buffer: ONE_PX_PNG,
        mimetype: "image/png",
        originalFilename: "a.png",
      });

      expect(result.id).toBe("asset-1");
      expect(gateway.uploadAsset).not.toHaveBeenCalled();
      expect(prisma.mediaAsset.create).not.toHaveBeenCalled();
    });

    it("uploads to Cloudinary and persists a new asset on first upload", async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      gateway.uploadAsset.mockResolvedValue({
        publicId: "maya-x/new123",
        url: "https://res.cloudinary.com/demo/image/upload/new123.png",
        format: "png",
        bytes: ONE_PX_PNG.length,
        width: 1,
        height: 1,
      });
      prisma.mediaAsset.create.mockResolvedValue(
        makeAssetRow({ id: "asset-new", publicId: "maya-x/new123" }),
      );

      const result = await service.upload({
        buffer: ONE_PX_PNG,
        mimetype: "image/png",
        originalFilename: "a.png",
        altText: "Alt text",
      });

      expect(gateway.uploadAsset).toHaveBeenCalledWith(
        expect.objectContaining({ buffer: ONE_PX_PNG }),
      );
      expect(result.id).toBe("asset-new");
      expect(result.usageCount).toBe(0);
    });

    it("rolls back the Cloudinary upload if persisting the row fails", async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      gateway.uploadAsset.mockResolvedValue({
        publicId: "maya-x/new123",
        url: "https://res.cloudinary.com/demo/image/upload/new123.png",
        format: "png",
        bytes: ONE_PX_PNG.length,
        width: 1,
        height: 1,
      });
      prisma.mediaAsset.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.upload({
          buffer: ONE_PX_PNG,
          mimetype: "image/png",
          originalFilename: "a.png",
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(gateway.deleteAsset).toHaveBeenCalledWith("maya-x/new123");
    });
  });

  describe("remove", () => {
    it("blocks deletion when the asset is still in use", async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue(makeAssetRow());
      prisma.mediaUsage.count.mockResolvedValue(2);

      await expect(service.remove("asset-1")).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.mediaAsset.delete).not.toHaveBeenCalled();
    });

    it("deletes the asset and its Cloudinary object when unused", async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue(makeAssetRow());
      prisma.mediaUsage.count.mockResolvedValue(0);

      await service.remove("asset-1");

      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({
        where: { id: "asset-1" },
      });
      expect(gateway.deleteAsset).toHaveBeenCalledWith("maya-x/abc123");
    });

    it("throws when the asset doesn't exist", async () => {
      prisma.mediaAsset.findFirst.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("bulkDelete", () => {
    it("only deletes assets with zero usages, reporting affected count", async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([
        makeAssetRow({ id: "asset-1" }),
        makeAssetRow({ id: "asset-2", publicId: "maya-x/def456" }),
      ]);
      prisma.mediaUsage.groupBy.mockResolvedValue([
        { mediaAssetId: "asset-1", _count: { _all: 3 } },
      ]);

      const result = await service.bulkDelete({
        mediaIds: ["asset-1", "asset-2"],
      });

      expect(prisma.mediaAsset.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["asset-2"] } },
      });
      expect(result).toEqual({ requested: 2, affected: 1 });
    });
  });

  describe("reorder", () => {
    it("rejects when mediaIds doesn't match the folder's current assets", async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([
        makeAssetRow({ id: "asset-1" }),
        makeAssetRow({ id: "asset-2" }),
      ]);

      await expect(
        service.reorder(undefined, { mediaIds: ["asset-1"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("reorders assets and returns them in sequence order", async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([
        makeAssetRow({ id: "asset-1" }),
        makeAssetRow({ id: "asset-2" }),
      ]);
      prisma.mediaAsset.update
        .mockResolvedValueOnce(makeAssetRow({ id: "asset-2", displayOrder: 0 }))
        .mockResolvedValueOnce(
          makeAssetRow({ id: "asset-1", displayOrder: 1 }),
        );

      const result = await service.reorder(undefined, {
        mediaIds: ["asset-2", "asset-1"],
      });

      expect(result.map((item) => item.id)).toEqual(["asset-2", "asset-1"]);
    });
  });

  describe("folders", () => {
    it("rejects a duplicate folder name with a domain error code", async () => {
      prisma.mediaFolder.create.mockRejectedValue(
        createUniqueConstraintError(),
      );

      await expect(
        service.createFolder({ name: "Talent Photos" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("rejects deleting a non-empty folder", async () => {
      prisma.mediaFolder.findUnique.mockResolvedValue({ id: "folder-1" });
      prisma.mediaAsset.count.mockResolvedValue(1);
      prisma.mediaFolder.count.mockResolvedValue(0);

      await expect(service.removeFolder("folder-1")).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.mediaFolder.delete).not.toHaveBeenCalled();
    });

    it("deletes an empty folder with no assets or sub-folders", async () => {
      prisma.mediaFolder.findUnique.mockResolvedValue({ id: "folder-1" });
      prisma.mediaAsset.count.mockResolvedValue(0);
      prisma.mediaFolder.count.mockResolvedValue(0);

      await service.removeFolder("folder-1");

      expect(prisma.mediaFolder.delete).toHaveBeenCalledWith({
        where: { id: "folder-1" },
      });
    });

    it("rejects a folder being its own parent", async () => {
      prisma.mediaFolder.findUnique.mockResolvedValue({ id: "folder-1" });

      await expect(
        service.updateFolder("folder-1", { parentId: "folder-1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
