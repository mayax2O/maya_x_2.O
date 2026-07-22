/**
 * Mirrors apps/api's membership_plans/subscriptions response envelopes
 * (docs/04-database §3.4). `highlighted` has no backend equivalent — it's
 * derived client-side (see lib/data/memberships.ts) to pick which plan
 * MembershipCard visually promotes as "Most popular".
 */

export type BillingCycle = "one_time" | "monthly" | "annual";

export type SubscriptionStatus =
  "pending_payment" | "active" | "expired" | "cancelled";

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

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan: MembershipPlan;
  priceAtPurchase: number;
  startsAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface PaymentOrder {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}
