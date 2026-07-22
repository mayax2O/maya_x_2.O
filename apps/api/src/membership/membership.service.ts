import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { isUniqueConstraintViolation } from "../common/prisma-error.util";
import type { CreateMembershipPlanDto } from "./dto/create-membership-plan.dto";
import type { UpdateMembershipPlanDto } from "./dto/update-membership-plan.dto";
import {
  toMembershipPlanResponse,
  type MembershipPlanResponse,
} from "./membership-plan.response";
import {
  toSubscriptionResponse,
  type SubscriptionResponse,
} from "./subscription.response";

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async findActivePlans(): Promise<MembershipPlanResponse[]> {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { price: "asc" },
    });
    return plans.map(toMembershipPlanResponse);
  }

  async findAllForAdmin(): Promise<MembershipPlanResponse[]> {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return plans.map(toMembershipPlanResponse);
  }

  async create(
    dto: CreateMembershipPlanDto,
    adminId: string,
  ): Promise<MembershipPlanResponse> {
    try {
      const plan = await this.prisma.membershipPlan.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          price: dto.price,
          currency: dto.currency ?? "INR",
          billingCycle: dto.billingCycle,
          benefits: dto.benefits ?? [],
          isActive: dto.isActive ?? true,
          createdBy: adminId,
        },
      });
      return toMembershipPlanResponse(plan);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "MEMBERSHIP_PLAN_SLUG_CONFLICT",
          message: "A membership plan with this slug already exists.",
        });
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateMembershipPlanDto,
  ): Promise<MembershipPlanResponse> {
    await this.findPlanOrThrow(id);
    try {
      const plan = await this.prisma.membershipPlan.update({
        where: { id },
        data: dto,
      });
      return toMembershipPlanResponse(plan);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "MEMBERSHIP_PLAN_SLUG_CONFLICT",
          message: "A membership plan with this slug already exists.",
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findPlanOrThrow(id);
    // Always soft delete — membership_plans is ON DELETE RESTRICT'd by
    // subscriptions at the database level (docs/04-database §3.4).
    await this.prisma.membershipPlan.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async subscribe(
    planId: string,
    userId: string,
  ): Promise<{ subscriptionId: string; status: string }> {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, isActive: true, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundException({
        code: "MEMBERSHIP_PLAN_NOT_FOUND",
        message: "Membership plan not found.",
      });
    }

    const existingActive = await this.prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });
    if (existingActive) {
      throw new ConflictException({
        code: "SUBSCRIPTION_ALREADY_ACTIVE",
        message: "You already have an active subscription.",
      });
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        membershipPlanId: plan.id,
        priceAtPurchase: plan.price,
      },
    });

    return { subscriptionId: subscription.id, status: subscription.status };
  }

  async findCurrentSubscription(
    userId: string,
  ): Promise<SubscriptionResponse | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      include: { membershipPlan: true },
      orderBy: { createdAt: "desc" },
    });
    return subscription ? toSubscriptionResponse(subscription) : null;
  }

  private async findPlanOrThrow(id: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundException({
        code: "MEMBERSHIP_PLAN_NOT_FOUND",
        message: "Membership plan not found.",
      });
    }
    return plan;
  }
}
