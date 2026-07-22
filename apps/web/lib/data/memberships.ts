import { apiFetch } from "../api/client";
import type { MembershipPlan, PaymentOrder, Subscription } from "../types";

interface RawMembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: MembershipPlan["billingCycle"];
  benefits: string[];
  isActive: boolean;
}

/**
 * No `highlighted` field exists on the API's plan response (see the note
 * in lib/types/membership.ts) — the middle-priced plan is promoted as
 * "Most popular" when there are 3+ plans; otherwise none is.
 */
function withHighlighted(plans: RawMembershipPlan[]): MembershipPlan[] {
  const sorted = [...plans].sort((a, b) => a.price - b.price);
  const highlightedId =
    sorted.length >= 3 ? sorted[Math.floor(sorted.length / 2)]?.id : undefined;
  return plans.map((plan) => ({
    ...plan,
    highlighted: plan.id === highlightedId,
  }));
}

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const plans = await apiFetch<RawMembershipPlan[]>("/membership-plans");
  return withHighlighted(plans.filter((plan) => plan.isActive));
}

export function subscribeToPlan(
  planId: string,
  accessToken: string,
): Promise<{ subscriptionId: string; status: string }> {
  return apiFetch<{ subscriptionId: string; status: string }>(
    `/membership-plans/${planId}/subscribe`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

export function createPaymentOrder(
  subscriptionId: string,
  accessToken: string,
): Promise<PaymentOrder> {
  return apiFetch<PaymentOrder>("/payments/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ subscriptionId }),
  });
}

export async function getMySubscription(
  accessToken: string,
): Promise<Subscription | null> {
  // apiFetch's `body?.data ?? undefined` treats a `{ data: null }` envelope
  // (no current subscription) the same as no body at all — normalize back
  // to `null` here so callers can distinguish "loaded, none" from "not yet
  // loaded" themselves.
  const result = await apiFetch<Subscription | null>("/me/subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return result ?? null;
}
