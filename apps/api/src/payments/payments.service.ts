import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "@prisma/client";

import type { EnvConfig } from "../config/env.validation";
import { PrismaService } from "../database/prisma.service";
import type { PaginatedResult } from "../common/pagination-result.interface";
import type { ListAdminPaymentsQueryDto } from "./dto/list-admin-payments.query.dto";
import {
  toAdminPaymentResponse,
  type AdminPaymentResponse,
} from "./payment.response";
import {
  RAZORPAY_GATEWAY,
  type RazorpayGateway,
} from "./razorpay-gateway.interface";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Billing-cycle length applied on activation — one_time subscriptions never expire. */
const BILLING_CYCLE_DAYS: Record<string, number | null> = {
  monthly: 30,
  annual: 365,
  one_time: null,
};

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig, true>,
    @Inject(RAZORPAY_GATEWAY) private readonly gateway: RazorpayGateway,
  ) {}

  async createOrder(
    subscriptionId: string,
    userId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
  }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundException({
        code: "SUBSCRIPTION_NOT_FOUND",
        message: "Subscription not found.",
      });
    }
    if (subscription.status !== "pending_payment") {
      throw new ConflictException({
        code: "SUBSCRIPTION_NOT_PENDING_PAYMENT",
        message: "This subscription is not awaiting payment.",
      });
    }

    // Idempotency: a retried request for the same subscription returns the
    // order already in flight instead of creating a duplicate at Razorpay.
    // (Simplification of the REST API Specification's Idempotency-Key
    // header requirement — scoped to "one pending order per subscription"
    // rather than a dedicated idempotency-key column, since a subscription
    // can only ever have one order awaiting payment at a time.)
    const existing = await this.prisma.payment.findFirst({
      where: { subscriptionId, status: "created" },
    });
    if (existing) {
      return {
        razorpayOrderId: existing.razorpayOrderId,
        amount: Number(existing.amount),
        currency: existing.currency,
        razorpayKeyId: this.configService.get("RAZORPAY_KEY_ID", {
          infer: true,
        }),
      };
    }

    const amountInSubunits = Math.round(
      Number(subscription.priceAtPurchase) * 100,
    );
    const order = await this.gateway.createOrder({
      amountInSubunits,
      currency: "INR",
      receipt: subscription.id,
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId,
        razorpayOrderId: order.id,
        amount: subscription.priceAtPurchase,
        currency: "INR",
      },
    });

    return {
      razorpayOrderId: payment.razorpayOrderId,
      amount: Number(payment.amount),
      currency: payment.currency,
      razorpayKeyId: this.configService.get("RAZORPAY_KEY_ID", {
        infer: true,
      }),
    };
  }

  async findAllForAdmin(
    query: ListAdminPaymentsQueryDto,
  ): Promise<PaginatedResult<AdminPaymentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.PaymentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items: rows.map(toAdminPaymentResponse), total };
  }

  /**
   * `rawBody` must be the exact bytes Razorpay signed. Always resolves
   * (never throws for an unrecognized/no-op event) so the caller can
   * return 200 quickly, per REST API Specification §7 — the one
   * exception is a signature that fails verification, which is rejected
   * before any state change is applied (SEC-04, SEC-07).
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<void> {
    if (
      !signature ||
      !this.gateway.verifyWebhookSignature(rawBody, signature)
    ) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_SIGNATURE",
        message: "Webhook signature verification failed.",
      });
    }

    const body = JSON.parse(rawBody.toString()) as RazorpayWebhookBody;
    const entity = body.payload?.payment?.entity;
    if (!entity?.order_id) return;

    const gatewayResponse = body as unknown as Prisma.InputJsonValue;
    if (body.event === "payment.captured") {
      await this.markCaptured(entity.order_id, entity.id, gatewayResponse);
    } else if (body.event === "payment.failed") {
      await this.markFailed(entity.order_id, gatewayResponse);
    }
  }

  private async markCaptured(
    razorpayOrderId: string,
    razorpayPaymentId: string | undefined,
    gatewayResponse: Prisma.InputJsonValue,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
    // A webhook for an order this API never created (or already
    // processed) is acknowledged, not treated as an error — Razorpay
    // retries on any non-2xx response.
    if (!payment || payment.status === "captured") return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "captured",
          razorpayPaymentId,
          gatewayResponse,
        },
      });

      const subscription = await tx.subscription.findUniqueOrThrow({
        where: { id: payment.subscriptionId },
        include: { membershipPlan: true },
      });
      const cycleDays =
        BILLING_CYCLE_DAYS[subscription.membershipPlan.billingCycle];
      const now = new Date();
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          startsAt: now,
          expiresAt: cycleDays
            ? new Date(now.getTime() + cycleDays * MS_PER_DAY)
            : null,
        },
      });
    });
  }

  private async markFailed(
    razorpayOrderId: string,
    gatewayResponse: Prisma.InputJsonValue,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
    if (!payment || payment.status === "captured") return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", gatewayResponse },
    });
  }
}
