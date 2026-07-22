import { authedFetch } from "../api/authFetch";
import type {
  MembershipPlan,
  MembershipPlanFormValues,
  UpdateMembershipPlanInput,
} from "../types";

export function listMembershipPlans(): Promise<MembershipPlan[]> {
  return authedFetch<MembershipPlan[]>("/admin/membership-plans");
}

export function createMembershipPlan(
  input: MembershipPlanFormValues,
): Promise<MembershipPlan> {
  return authedFetch<MembershipPlan>("/admin/membership-plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateMembershipPlan(
  id: string,
  input: UpdateMembershipPlanInput,
): Promise<MembershipPlan> {
  return authedFetch<MembershipPlan>(`/admin/membership-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteMembershipPlan(id: string): Promise<void> {
  return authedFetch<void>(`/admin/membership-plans/${id}`, {
    method: "DELETE",
  });
}
