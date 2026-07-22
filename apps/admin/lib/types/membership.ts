export type BillingCycle = "one_time" | "monthly" | "annual";

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  benefits: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanFormValues {
  name: string;
  slug: string;
  price: number;
  currency?: string;
  billingCycle: BillingCycle;
  benefits?: string[];
  isActive?: boolean;
}

export type UpdateMembershipPlanInput = Partial<MembershipPlanFormValues>;
