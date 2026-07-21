import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { TalentCategoriesService } from "./talent-categories.service";

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

describe("TalentCategoriesService", () => {
  let service: TalentCategoriesService;
  let prisma: {
    talentCategory: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const categoryRow = {
    id: "cat-1",
    name: "Event Host",
    slug: "event-host",
    isActive: true,
    displayOrder: 1,
  };

  beforeEach(async () => {
    prisma = {
      talentCategory: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TalentCategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(TalentCategoriesService);
  });

  describe("create", () => {
    it("auto-derives the slug from the name when omitted", async () => {
      prisma.talentCategory.create.mockResolvedValue(categoryRow);

      await service.create({ name: "Event Host" });

      expect(prisma.talentCategory.create).toHaveBeenCalledWith({
        data: {
          name: "Event Host",
          slug: "event-host",
          isActive: true,
          displayOrder: 0,
        },
      });
    });

    it("uses the given slug when provided", async () => {
      prisma.talentCategory.create.mockResolvedValue(categoryRow);

      await service.create({ name: "Event Host", slug: "custom-slug" });

      const callArgs = prisma.talentCategory.create.mock.calls[0][0];
      expect(callArgs.data.slug).toBe("custom-slug");
    });

    it("maps a duplicate slug to 409 Conflict", async () => {
      prisma.talentCategory.create.mockRejectedValue(
        createUniqueConstraintError(),
      );

      await expect(
        service.create({ name: "Event Host" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when missing", async () => {
      prisma.talentCategory.findUnique.mockResolvedValue(null);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("bulkAction", () => {
    it("deletes the given ids", async () => {
      prisma.talentCategory.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkAction({
        ids: ["cat-1"],
        action: "delete",
      });

      expect(result).toEqual({ requested: 1, affected: 1 });
    });
  });
});
