import membershipPlansJson from "../mock/membership-plans.json";
import type { MembershipPlan } from "../types";

const membershipPlans = membershipPlansJson as MembershipPlan[];

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  return membershipPlans.filter((plan) => plan.isActive);
}
