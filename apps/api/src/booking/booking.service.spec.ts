import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { PrismaService } from "../database/prisma.service";
import { BookingService } from "./booking.service";

const talentRow = { id: "talent-1", isActive: true, deletedAt: null };

function makeBookingRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "booking-1",
    userId: null,
    talentId: "talent-1",
    guestName: "Priya Sharma",
    guestEmail: "priya@example.com",
    guestPhone: null,
    status: "submitted",
    eventDate: null,
    eventDetails: "A wedding reception",
    createdAt: new Date("2026-07-22T00:00:00Z"),
    updatedAt: new Date("2026-07-22T00:00:00Z"),
    deletedAt: null,
    talent: { id: "talent-1", slug: "ananya-rao", displayName: "Ananya Rao" },
    user: null,
    statusHistory: [],
    ...overrides,
  };
}

const MEMBER: AccessTokenPayload = {
  sub: "user-1",
  type: "user",
  roles: ["user"],
};
const ADMIN: AccessTokenPayload = {
  sub: "admin-1",
  type: "admin",
  roles: ["admin"],
};

describe("BookingService", () => {
  let service: BookingService;
  let prisma: {
    talent: { findFirst: jest.Mock };
    bookingRequest: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    bookingStatusHistory: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      talent: { findFirst: jest.fn() },
      bookingRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      bookingStatusHistory: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return arg(prisma);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [BookingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(BookingService);
  });

  describe("create", () => {
    it("rejects a guest submission missing name/email", async () => {
      await expect(
        service.create({ talentId: "talent-1" }, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.talent.findFirst).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the talent doesn't exist or isn't active", async () => {
      prisma.talent.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            talentId: "missing",
            guestName: "Priya Sharma",
            guestEmail: "priya@example.com",
          },
          undefined,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("creates a guest booking and logs the initial status history row", async () => {
      prisma.talent.findFirst.mockResolvedValue(talentRow);
      prisma.bookingRequest.create.mockResolvedValue(makeBookingRow());
      prisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await service.create(
        {
          talentId: "talent-1",
          guestName: "Priya Sharma",
          guestEmail: "priya@example.com",
        },
        undefined,
      );

      expect(prisma.bookingRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            talentId: "talent-1",
            userId: undefined,
            guestName: "Priya Sharma",
            guestEmail: "priya@example.com",
          }),
        }),
      );
      expect(prisma.bookingStatusHistory.create).toHaveBeenCalledWith({
        data: {
          bookingRequestId: "booking-1",
          previousStatus: null,
          newStatus: "submitted",
        },
      });
      expect(result.customer).toEqual({
        type: "guest",
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: null,
      });
    });

    it("creates a member booking using the authenticated user's id, ignoring guest fields", async () => {
      prisma.talent.findFirst.mockResolvedValue(talentRow);
      prisma.bookingRequest.create.mockResolvedValue(
        makeBookingRow({
          userId: "user-1",
          guestName: null,
          guestEmail: null,
          user: {
            id: "user-1",
            fullName: "Arjun Mehta",
            email: "arjun@example.com",
            phone: null,
          },
        }),
      );
      prisma.bookingStatusHistory.create.mockResolvedValue({});

      await service.create({ talentId: "talent-1" }, MEMBER);

      expect(prisma.bookingRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            guestName: undefined,
            guestEmail: undefined,
          }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when missing or soft-deleted", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(null);
      await expect(service.findOne("missing", ADMIN)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("allows an Admin to view any booking", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(makeBookingRow());
      const result = await service.findOne("booking-1", ADMIN);
      expect(result.id).toBe("booking-1");
    });

    it("allows the owning Member to view their own booking", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(
        makeBookingRow({ userId: "user-1" }),
      );
      const result = await service.findOne("booking-1", MEMBER);
      expect(result.id).toBe("booking-1");
    });

    it("rejects a Member viewing someone else's booking", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(
        makeBookingRow({ userId: "someone-else" }),
      );
      await expect(service.findOne("booking-1", MEMBER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("updateStatus", () => {
    it("throws NotFoundException when the booking doesn't exist", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(null);
      await expect(
        service.updateStatus(
          "missing",
          { newStatus: "under_review" },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects an illegal transition with 409 Conflict", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(
        makeBookingRow({ status: "submitted" }),
      );

      await expect(
        service.updateStatus(
          "booking-1",
          { newStatus: "confirmed" },
          "admin-1",
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.bookingRequest.update).not.toHaveBeenCalled();
    });

    it("applies a legal transition and appends a status history row", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(
        makeBookingRow({ status: "submitted" }),
      );
      prisma.bookingRequest.update.mockResolvedValue(
        makeBookingRow({ status: "under_review" }),
      );
      prisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await service.updateStatus(
        "booking-1",
        { newStatus: "under_review", notes: "Reached out via email" },
        "admin-1",
      );

      expect(prisma.bookingRequest.update).toHaveBeenCalledWith({
        where: { id: "booking-1" },
        data: { status: "under_review" },
        include: expect.anything(),
      });
      expect(prisma.bookingStatusHistory.create).toHaveBeenCalledWith({
        data: {
          bookingRequestId: "booking-1",
          adminUserId: "admin-1",
          previousStatus: "submitted",
          newStatus: "under_review",
          notes: "Reached out via email",
        },
      });
      expect(result.status).toBe("under_review");
    });

    it("allows the documented terminal-adjacent transitions (declined/expired/cancelled)", async () => {
      prisma.bookingRequest.findFirst.mockResolvedValue(
        makeBookingRow({ status: "confirmed" }),
      );
      prisma.bookingRequest.update.mockResolvedValue(
        makeBookingRow({ status: "cancelled" }),
      );
      prisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await service.updateStatus(
        "booking-1",
        { newStatus: "cancelled" },
        "admin-1",
      );

      expect(result.status).toBe("cancelled");
    });
  });

  describe("findAllForUser / findAllForAdmin", () => {
    it("scopes the customer's own list to their userId", async () => {
      prisma.$transaction.mockResolvedValue([[makeBookingRow()], 1]);

      const result = await service.findAllForUser("user-1", {
        page: 1,
        perPage: 20,
      });

      expect(result.total).toBe(1);
      expect(prisma.bookingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
        }),
      );
    });

    it("filters the admin queue by status and talentId", async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAllForAdmin({
        page: 1,
        perPage: 20,
        sortOrder: "asc",
        status: "under_review",
        talentId: "talent-1",
      });

      expect(prisma.bookingRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "under_review",
            talentId: "talent-1",
          }),
        }),
      );
    });
  });
});
