import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { MembershipService } from "./membership.service";

function createUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

function makePlanRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "plan-1",
    name: "Gold",
    slug: "gold",
    price: new Prisma.Decimal(4999),
    currency: "INR",
    billingCycle: "monthly",
    benefits: ["Priority review"],
    isActive: true,
    createdBy: "admin-1",
    createdAt: new Date("2026-07-22T00:00:00Z"),
    updatedAt: new Date("2026-07-22T00:00:00Z"),
    deletedAt: null,
    ...overrides,
  };
}

describe("MembershipService", () => {
  let service: MembershipService;
  let prisma: {
    membershipPlan: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
    subscription: { findFirst: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      membershipPlan: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      subscription: { findFirst: jest.fn(), create: jest.fn() },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(MembershipService);
  });

  describe("findActivePlans", () => {
    it("maps rows to responses ordered by price", async () => {
      prisma.membershipPlan.findMany.mockResolvedValue([makePlanRow()]);
      const result = await service.findActivePlans();
      expect(prisma.membershipPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, deletedAt: null },
        }),
      );
      expect(result[0]?.price).toBe(4999);
    });
  });

  describe("create", () => {
    it("maps a duplicate slug to 409 Conflict", async () => {
      prisma.membershipPlan.create.mockRejectedValue(
        createUniqueConstraintError(),
      );
      await expect(
        service.create(
          { name: "Gold", slug: "gold", price: 4999, billingCycle: "monthly" },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates a plan with defaults applied", async () => {
      prisma.membershipPlan.create.mockResolvedValue(makePlanRow());
      await service.create(
        { name: "Gold", slug: "gold", price: 4999, billingCycle: "monthly" },
        "admin-1",
      );
      expect(prisma.membershipPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: "INR",
          benefits: [],
          isActive: true,
          createdBy: "admin-1",
        }),
      });
    });
  });

  describe("update / remove", () => {
    it("throws NotFoundException when missing or soft-deleted", async () => {
      prisma.membershipPlan.findFirst.mockResolvedValue(null);
      await expect(
        service.update("missing", { name: "New name" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("soft-deletes and deactivates", async () => {
      prisma.membershipPlan.findFirst.mockResolvedValue(makePlanRow());
      prisma.membershipPlan.update.mockResolvedValue(
        makePlanRow({ deletedAt: new Date(), isActive: false }),
      );
      await service.remove("plan-1");
      expect(prisma.membershipPlan.update).toHaveBeenCalledWith({
        where: { id: "plan-1" },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });
  });

  describe("subscribe", () => {
    it("throws NotFoundException when the plan doesn't exist or isn't active", async () => {
      prisma.membershipPlan.findFirst.mockResolvedValue(null);
      await expect(
        service.subscribe("plan-1", "user-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects when the user already has an active subscription", async () => {
      prisma.membershipPlan.findFirst.mockResolvedValue(makePlanRow());
      prisma.subscription.findFirst.mockResolvedValue({
        id: "sub-existing",
        status: "active",
      });
      await expect(
        service.subscribe("plan-1", "user-1"),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it("creates a pending_payment subscription priced from the plan", async () => {
      prisma.membershipPlan.findFirst.mockResolvedValue(makePlanRow());
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        id: "sub-1",
        status: "pending_payment",
      });

      const result = await service.subscribe("plan-1", "user-1");

      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          membershipPlanId: "plan-1",
          priceAtPurchase: makePlanRow().price,
        },
      });
      expect(result).toEqual({
        subscriptionId: "sub-1",
        status: "pending_payment",
      });
    });
  });

  describe("findCurrentSubscription", () => {
    it("returns null when the user has no subscription", async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const result = await service.findCurrentSubscription("user-1");
      expect(result).toBeNull();
    });
  });
});
