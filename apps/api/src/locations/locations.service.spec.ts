import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { LocationsService } from "./locations.service";

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

describe("LocationsService", () => {
  let service: LocationsService;
  let prisma: {
    location: {
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

  const cityRow = { id: "city-1", name: "Kolkata", state: "West Bengal" };
  const locationRow = {
    id: "loc-1",
    name: "Park Street",
    cityId: "city-1",
    city: cityRow,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date("2026-07-21T00:00:00Z"),
    updatedAt: new Date("2026-07-21T00:00:00Z"),
  };

  beforeEach(async () => {
    prisma = {
      location: {
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
        LocationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  describe("create", () => {
    it("creates a location and includes the city in the response", async () => {
      prisma.location.create.mockResolvedValue(locationRow);

      const result = await service.create({
        name: "Park Street",
        cityId: "city-1",
      });

      expect(result.city).toEqual({
        id: "city-1",
        name: "Kolkata",
        state: "West Bengal",
      });
    });

    it("maps a missing city (FK violation) to a 409", async () => {
      prisma.location.create.mockRejectedValue(createForeignKeyError());

      await expect(
        service.create({ name: "Park Street", cityId: "missing-city" }),
      ).rejects.toMatchObject({ response: { code: "CITY_NOT_FOUND" } });
    });

    it("maps a duplicate name-within-city to a 409", async () => {
      prisma.location.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.create({ name: "Park Street", cityId: "city-1" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when missing", async () => {
      prisma.location.findUnique.mockResolvedValue(null);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("maps a foreign key violation to LOCATION_IN_USE", async () => {
      prisma.location.findUnique.mockResolvedValue(locationRow);
      prisma.location.delete.mockRejectedValue(createForeignKeyError());

      await expect(service.remove("loc-1")).rejects.toMatchObject({
        response: { code: "LOCATION_IN_USE" },
      });
    });
  });

  describe("bulkAction", () => {
    it("deactivates the given ids", async () => {
      prisma.location.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkAction({
        ids: ["a", "b", "c"],
        action: "deactivate",
      });

      expect(prisma.location.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["a", "b", "c"] } },
        data: { isActive: false },
      });
      expect(result).toEqual({ requested: 3, affected: 3 });
    });
  });
});
