import type { BillingCycle, MembershipPlan } from "@prisma/client";

export interface MembershipPlanResponse {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toMembershipPlanResponse(
  plan: MembershipPlan,
): MembershipPlanResponse {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: Number(plan.price),
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    benefits: Array.isArray(plan.benefits) ? (plan.benefits as string[]) : [],
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}
