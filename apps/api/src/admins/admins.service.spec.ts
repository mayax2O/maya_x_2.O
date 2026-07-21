import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { AdminsService } from "./admins.service";

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

describe("AdminsService", () => {
  let service: AdminsService;
  let prisma: {
    admin: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const now = new Date("2026-07-21T00:00:00Z");
  const adminRow = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    fullName: "Admin User",
    passwordHash: "hashed",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      admin: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AdminsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AdminsService);
  });

  describe("create", () => {
    it("hashes the password and never returns it", async () => {
      prisma.admin.create.mockResolvedValue(adminRow);

      const result = await service.create({
        email: "admin@example.com",
        fullName: "Admin User",
        password: "Password1",
      });

      expect(prisma.admin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "admin@example.com",
            fullName: "Admin User",
            isActive: true,
          }),
        }),
      );
      const createCallArgs = prisma.admin.create.mock.calls[0][0];
      expect(createCallArgs.data.passwordHash).not.toBe("Password1");
      expect(result).not.toHaveProperty("passwordHash");
      expect(result.email).toBe("admin@example.com");
    });

    it("maps a unique constraint violation to a 409 Conflict", async () => {
      prisma.admin.create.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.create({
          email: "admin@example.com",
          fullName: "Admin User",
          password: "Password1",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("findAll", () => {
    it("paginates and excludes soft-deleted rows", async () => {
      prisma.$transaction.mockResolvedValue([[adminRow], 1]);

      const result = await service.findAll({ page: 2, perPage: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.email).toBe("admin@example.com");
    });
  });

  describe("findOne", () => {
    it("returns the mapped admin when found", async () => {
      prisma.admin.findFirst.mockResolvedValue(adminRow);

      const result = await service.findOne(adminRow.id);

      expect(prisma.admin.findFirst).toHaveBeenCalledWith({
        where: { id: adminRow.id, deletedAt: null },
      });
      expect(result.id).toBe(adminRow.id);
    });

    it("throws NotFoundException when missing or soft-deleted", async () => {
      prisma.admin.findFirst.mockResolvedValue(null);

      await expect(service.findOne("missing-id")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("404s before attempting the update when the admin does not exist", async () => {
      prisma.admin.findFirst.mockResolvedValue(null);

      await expect(
        service.update("missing-id", { fullName: "New Name" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.admin.update).not.toHaveBeenCalled();
    });

    it("re-hashes the password only when one is provided", async () => {
      prisma.admin.findFirst.mockResolvedValue(adminRow);
      prisma.admin.update.mockResolvedValue(adminRow);

      await service.update(adminRow.id, { fullName: "Updated Name" });

      const updateArgs = prisma.admin.update.mock.calls[0][0];
      expect(updateArgs.data).not.toHaveProperty("passwordHash");
      expect(updateArgs.data.fullName).toBe("Updated Name");
    });

    it("maps a unique constraint violation on update to a 409 Conflict", async () => {
      prisma.admin.findFirst.mockResolvedValue(adminRow);
      prisma.admin.update.mockRejectedValue(createUniqueConstraintError());

      await expect(
        service.update(adminRow.id, { email: "taken@example.com" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("remove", () => {
    it("soft-deletes by setting deletedAt", async () => {
      prisma.admin.findFirst.mockResolvedValue(adminRow);
      prisma.admin.update.mockResolvedValue({
        ...adminRow,
        deletedAt: now,
      });

      await service.remove(adminRow.id);

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: adminRow.id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("404s when the admin does not exist", async () => {
      prisma.admin.findFirst.mockResolvedValue(null);

      await expect(service.remove("missing-id")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
