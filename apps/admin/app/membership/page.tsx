"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { MembershipPlanFormModal } from "../../components/membership/MembershipPlanFormModal";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import {
  deleteMembershipPlan,
  listMembershipPlans,
} from "../../lib/data/membership";
import type { MembershipPlan } from "../../lib/types";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function MembershipContent() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<MembershipPlan | "new" | null>(
    null,
  );

  function load() {
    setLoading(true);
    setError(null);
    listMembershipPlans()
      .then(setPlans)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load plans."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDeactivate(plan: MembershipPlan) {
    if (!window.confirm(`Deactivate "${plan.name}"?`)) return;
    try {
      await deleteMembershipPlan(plan.id);
      showToast("Plan deactivated.", "success");
      load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to deactivate plan.",
        "error",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Membership Plans
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Manage the plans customers can subscribe to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalPlan("new")}
          className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass"
        >
          Add plan
        </button>
      </div>

      {plans.length === 0 ? (
        <p className="text-[13.5px] text-porcelain/50">
          No membership plans yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-ink-soft">
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-white/10 text-[12px] uppercase tracking-wide text-porcelain/50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Billing cycle</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((plan) => (
                <tr key={plan.id} className="text-porcelain/85">
                  <td className="px-4 py-3 font-medium text-porcelain">
                    {plan.name}
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(plan.price, plan.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {plan.billingCycle.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        plan.isActive ? "text-success" : "text-porcelain/40"
                      }
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setModalPlan(plan)}
                      className="mr-3 text-[12.5px] font-medium text-brass hover:text-brass-deep"
                    >
                      Edit
                    </button>
                    {plan.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(plan)}
                        className="text-[12.5px] font-medium text-danger hover:brightness-110"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MembershipPlanFormModal
        isOpen={modalPlan !== null}
        plan={modalPlan && modalPlan !== "new" ? modalPlan : undefined}
        onClose={() => setModalPlan(null)}
        onSaved={load}
      />
    </div>
  );
}

export default function MembershipPage() {
  return (
    <AdminShell>
      <MembershipContent />
    </AdminShell>
  );
}
