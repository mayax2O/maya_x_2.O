import type { Subscription, SubscriptionStatus } from "@prisma/client";

import {
  toMembershipPlanResponse,
  type MembershipPlanResponse,
} from "./membership-plan.response";
import type { MembershipPlan } from "@prisma/client";

export type SubscriptionWithPlan = Subscription & {
  membershipPlan: MembershipPlan;
};

export interface SubscriptionResponse {
  id: string;
  status: SubscriptionStatus;
  plan: MembershipPlanResponse;
  priceAtPurchase: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export function toSubscriptionResponse(
  subscription: SubscriptionWithPlan,
): SubscriptionResponse {
  return {
    id: subscription.id,
    status: subscription.status,
    plan: toMembershipPlanResponse(subscription.membershipPlan),
    priceAtPurchase: Number(subscription.priceAtPurchase),
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    cancelledAt: subscription.cancelledAt,
    createdAt: subscription.createdAt,
  };
}
