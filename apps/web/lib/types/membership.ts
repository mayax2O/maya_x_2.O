/**
 * Mirrors MEMBERSHIP_PLANS (docs/04-database) — see the note in talent.ts
 * about this being a frontend-local stand-in until @maya-x/types grows a
 * real Membership domain type.
 */

export type BillingCycle = "monthly" | "yearly";

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  benefits: string[];
  isActive: boolean;
  highlighted: boolean;
}
