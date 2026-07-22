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
import { PaymentsService } from "./payments.service";
import { RAZORPAY_GATEWAY } from "./razorpay-gateway.interface";

function makeSubscriptionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sub-1",
    userId: "user-1",
    membershipPlanId: "plan-1",
    status: "pending_payment",
    priceAtPurchase: new Prisma.Decimal(4999),
    membershipPlan: { billingCycle: "monthly" },
    ...overrides,
  };
}

function makePaymentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "payment-1",
    userId: "user-1",
    subscriptionId: "sub-1",
    razorpayOrderId: "order_abc123",
    razorpayPaymentId: null,
    amount: new Prisma.Decimal(4999),
    currency: "INR",
    status: "created",
    gatewayResponse: {},
    createdAt: new Date("2026-07-22T00:00:00Z"),
    updatedAt: new Date("2026-07-22T00:00:00Z"),
    ...overrides,
  };
}

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: {
    subscription: {
      findFirst: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    payment: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let gateway: { createOrder: jest.Mock; verifyWebhookSignature: jest.Mock };

  beforeEach(async () => {
    prisma = {
      subscription: {
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return arg(prisma);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    });

    gateway = { createOrder: jest.fn(), verifyWebhookSignature: jest.fn() };

    const configService = { get: jest.fn().mockReturnValue("rzp_test_fake") };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: RAZORPAY_GATEWAY, useValue: gateway },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  describe("createOrder", () => {
    it("throws NotFoundException when the subscription doesn't belong to the caller", async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(
        service.createOrder("sub-1", "user-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects a subscription that isn't awaiting payment", async () => {
      prisma.subscription.findFirst.mockResolvedValue(
        makeSubscriptionRow({ status: "active" }),
      );
      await expect(
        service.createOrder("sub-1", "user-1"),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(gateway.createOrder).not.toHaveBeenCalled();
    });

    it("returns the existing order instead of creating a duplicate (idempotency)", async () => {
      prisma.subscription.findFirst.mockResolvedValue(makeSubscriptionRow());
      prisma.payment.findFirst.mockResolvedValue(makePaymentRow());

      const result = await service.createOrder("sub-1", "user-1");

      expect(gateway.createOrder).not.toHaveBeenCalled();
      expect(result.razorpayOrderId).toBe("order_abc123");
    });

    it("creates a new Razorpay order and Payment row when none is pending", async () => {
      prisma.subscription.findFirst.mockResolvedValue(makeSubscriptionRow());
      prisma.payment.findFirst.mockResolvedValue(null);
      gateway.createOrder.mockResolvedValue({
        id: "order_new",
        amount: 499900,
        currency: "INR",
      });
      prisma.payment.create.mockResolvedValue(
        makePaymentRow({ razorpayOrderId: "order_new" }),
      );

      const result = await service.createOrder("sub-1", "user-1");

      expect(gateway.createOrder).toHaveBeenCalledWith({
        amountInSubunits: 499900,
        currency: "INR",
        receipt: "sub-1",
      });
      expect(result.razorpayOrderId).toBe("order_new");
      expect(result.razorpayKeyId).toBe("rzp_test_fake");
    });
  });

  describe("handleWebhook", () => {
    const rawBody = Buffer.from(
      JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_1",
              order_id: "order_abc123",
              status: "captured",
            },
          },
        },
      }),
    );

    it("rejects an invalid signature without touching the database", async () => {
      gateway.verifyWebhookSignature.mockReturnValue(false);
      await expect(
        service.handleWebhook(rawBody, "bad-signature"),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it("no-ops for an order it doesn't recognize", async () => {
      gateway.verifyWebhookSignature.mockReturnValue(true);
      prisma.payment.findUnique.mockResolvedValue(null);
      await service.handleWebhook(rawBody, "good-signature");
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it("marks the payment captured and activates the subscription", async () => {
      gateway.verifyWebhookSignature.mockReturnValue(true);
      prisma.payment.findUnique.mockResolvedValue(makePaymentRow());
      prisma.subscription.findUniqueOrThrow.mockResolvedValue(
        makeSubscriptionRow(),
      );

      await service.handleWebhook(rawBody, "good-signature");

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "payment-1" },
          data: expect.objectContaining({
            status: "captured",
            razorpayPaymentId: "pay_1",
          }),
        }),
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-1" },
          data: expect.objectContaining({ status: "active" }),
        }),
      );
      const updateCall = prisma.subscription.update.mock.calls[0][0];
      expect(updateCall.data.expiresAt).toBeInstanceOf(Date);
    });

    it("does not re-activate an already-captured payment", async () => {
      gateway.verifyWebhookSignature.mockReturnValue(true);
      prisma.payment.findUnique.mockResolvedValue(
        makePaymentRow({ status: "captured" }),
      );
      await service.handleWebhook(rawBody, "good-signature");
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it("marks the payment failed on a payment.failed event", async () => {
      const failedBody = Buffer.from(
        JSON.stringify({
          event: "payment.failed",
          payload: {
            payment: { entity: { id: "pay_2", order_id: "order_abc123" } },
          },
        }),
      );
      gateway.verifyWebhookSignature.mockReturnValue(true);
      prisma.payment.findUnique.mockResolvedValue(makePaymentRow());

      await service.handleWebhook(failedBody, "good-signature");

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "payment-1" },
          data: expect.objectContaining({ status: "failed" }),
        }),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe("findAllForAdmin", () => {
    it("filters by status and userId", async () => {
      prisma.$transaction.mockResolvedValue([
        [
          {
            ...makePaymentRow(),
            user: {
              id: "user-1",
              fullName: "Arjun Mehta",
              email: "arjun@example.com",
            },
          },
        ],
        1,
      ]);

      const result = await service.findAllForAdmin({
        page: 1,
        perPage: 20,
        status: "captured",
        userId: "user-1",
      });

      expect(result.total).toBe(1);
      expect(result.items[0]?.user.email).toBe("arjun@example.com");
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "captured", userId: "user-1" },
        }),
      );
    });
  });
});
