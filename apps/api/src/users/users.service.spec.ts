import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { UsersService } from "./users.service";

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

describe("UsersService", () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const now = new Date("2026-07-21T00:00:00Z");
  const userRow = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user@example.com",
    fullName: "Test User",
    phone: "+919812345600",
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe("create", () => {
    it("creates a user and returns the mapped response", async () => {
      prisma.user.create.mockResolvedValue(userRow);

      const result = await service.create({
        email: "user@example.com",
        fullName: "Test User",
        phone: "+919812345600",
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "user@example.com",
          fullName: "Test User",
          phone: "+919812345600",
        },
      });
      expect(result.email).toBe("user@example.com");
    });

    it("maps a unique constraint violation to a 409 Conflict", async () => {
      prisma.user.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.create({ email: "user@example.com", fullName: "Test User" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("findAll", () => {
    it("paginates and excludes soft-deleted rows", async () => {
      prisma.$transaction.mockResolvedValue([[userRow], 1]);

      const result = await service.findAll({ page: 1, perPage: 20 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when missing or soft-deleted", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne("missing-id")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("404s before attempting the update when the user does not exist", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update("missing-id", { fullName: "New Name" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("maps a unique constraint violation on update to a 409 Conflict", async () => {
      prisma.user.findFirst.mockResolvedValue(userRow);
      prisma.user.update.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.update(userRow.id, { email: "taken@example.com" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("remove", () => {
    it("soft-deletes by setting deletedAt", async () => {
      prisma.user.findFirst.mockResolvedValue(userRow);
      prisma.user.update.mockResolvedValue({ ...userRow, deletedAt: now });

      await service.remove(userRow.id);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userRow.id },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
