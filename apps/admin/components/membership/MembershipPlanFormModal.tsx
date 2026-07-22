"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import {
  createMembershipPlan,
  updateMembershipPlan,
} from "../../lib/data/membership";
import type { BillingCycle, MembershipPlan } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "one_time", label: "One-time" },
];

export function MembershipPlanFormModal({
  plan,
  isOpen,
  onClose,
  onSaved,
}: {
  plan?: MembershipPlan;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (plan: MembershipPlan) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(plan?.name ?? "");
  const [slug, setSlug] = useState(plan?.slug ?? "");
  const [price, setPrice] = useState(plan?.price ?? 0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    plan?.billingCycle ?? "monthly",
  );
  const [benefits, setBenefits] = useState(plan?.benefits.join("\n") ?? "");
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");
    const benefitList = benefits
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      const saved = plan
        ? await updateMembershipPlan(plan.id, {
            name,
            slug,
            price,
            billingCycle,
            benefits: benefitList,
            isActive,
          })
        : await createMembershipPlan({
            name,
            slug,
            price,
            billingCycle,
            benefits: benefitList,
            isActive,
          });
      showToast(plan ? "Plan updated." : "Plan created.", "success");
      onSaved(saved);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <Modal
      title={plan ? "Edit membership plan" : "Add membership plan"}
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="plan-name"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Name
          </label>
          <input
            id="plan-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="plan-slug"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Slug
          </label>
          <input
            id="plan-slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plan-price"
              className="text-[13px] font-medium text-porcelain/70"
            >
              Price (INR)
            </label>
            <input
              id="plan-price"
              type="number"
              min={0}
              required
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plan-cycle"
              className="text-[13px] font-medium text-porcelain/70"
            >
              Billing cycle
            </label>
            <select
              id="plan-cycle"
              value={billingCycle}
              onChange={(event) =>
                setBillingCycle(event.target.value as BillingCycle)
              }
              className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
            >
              {BILLING_CYCLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="plan-benefits"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Benefits (one per line)
          </label>
          <textarea
            id="plan-benefits"
            rows={4}
            value={benefits}
            onChange={(event) => setBenefits(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-[13.5px] text-porcelain/80">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 accent-brass-deep"
          />
          Active (visible to customers)
        </label>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "submitting" ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
