import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { CitiesService } from "./cities.service";

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

describe("CitiesService", () => {
  let service: CitiesService;
  let prisma: {
    city: {
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

  const cityRow = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kolkata",
    state: "West Bengal",
    isActive: true,
    displayOrder: 1,
    createdAt: new Date("2026-07-21T00:00:00Z"),
    updatedAt: new Date("2026-07-21T00:00:00Z"),
  };

  beforeEach(async () => {
    prisma = {
      city: {
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
      providers: [CitiesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CitiesService);
  });

  describe("create", () => {
    it("creates a city with defaults applied", async () => {
      prisma.city.create.mockResolvedValue(cityRow);

      const result = await service.create({
        name: "Kolkata",
        state: "West Bengal",
      });

      expect(prisma.city.create).toHaveBeenCalledWith({
        data: {
          name: "Kolkata",
          state: "West Bengal",
          isActive: true,
          displayOrder: 0,
        },
      });
      expect(result.name).toBe("Kolkata");
    });

    it("maps a unique constraint violation to 409 Conflict", async () => {
      prisma.city.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.create({ name: "Kolkata", state: "West Bengal" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("findAll", () => {
    it("paginates and applies the isActive filter", async () => {
      prisma.$transaction.mockResolvedValue([[cityRow], 1]);

      const result = await service.findAll({
        page: 1,
        perPage: 20,
        isActive: true,
        sortOrder: "asc",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.items[0]?.name).toBe("Kolkata");
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when missing", async () => {
      prisma.city.findUnique.mockResolvedValue(null);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("maps a foreign key violation to a 409 CITY_IN_USE error", async () => {
      prisma.city.findUnique.mockResolvedValue(cityRow);
      prisma.city.delete.mockRejectedValue(createForeignKeyError());

      await expect(service.remove(cityRow.id)).rejects.toMatchObject({
        response: { code: "CITY_IN_USE" },
      });
    });
  });

  describe("bulkAction", () => {
    it("activates the given ids", async () => {
      prisma.city.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAction({
        ids: ["a", "b"],
        action: "activate",
      });

      expect(prisma.city.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["a", "b"] } },
        data: { isActive: true },
      });
      expect(result).toEqual({ requested: 2, affected: 2 });
    });

    it("maps a foreign key violation on bulk delete to a 409", async () => {
      prisma.city.deleteMany.mockRejectedValue(createForeignKeyError());

      await expect(
        service.bulkAction({ ids: ["a"], action: "delete" }),
      ).rejects.toMatchObject({ response: { code: "CITY_IN_USE" } });
    });
  });
});
