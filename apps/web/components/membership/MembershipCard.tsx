import { Button } from "@maya-x/ui";

import { formatPrice } from "../../lib/format";
import type { MembershipPlan } from "../../lib/types";

export function MembershipCard({ plan }: { plan: MembershipPlan }) {
  return (
    <div
      className={[
        "flex flex-col rounded-lg p-6",
        plan.highlighted
          ? "bg-ink text-porcelain ring-2 ring-brass-deep"
          : "bg-white text-ink ring-1 ring-ink/5",
      ].join(" ")}
    >
      {plan.highlighted ? (
        <p className="mb-3 inline-flex w-fit items-center rounded-full bg-brass-deep px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-white">
          Most popular
        </p>
      ) : null}

      <h3 className="font-display text-xl font-semibold">{plan.name}</h3>

      <p className="mt-4 font-display text-3xl font-semibold">
        {plan.price === 0 ? "Free" : formatPrice(plan.price, plan.currency)}
        {plan.price > 0 ? (
          <span
            className={[
              "text-sm font-normal",
              plan.highlighted ? "text-porcelain/60" : "text-slate",
            ].join(" ")}
          >
            {" "}
            / {plan.billingCycle === "yearly" ? "year" : "month"}
          </span>
        ) : null}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-3" role="list">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-[14.5px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={[
                "mt-0.5 h-4 w-4 shrink-0",
                plan.highlighted ? "text-brass-tint" : "text-brass-deep",
              ].join(" ")}
              aria-hidden="true"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
            <span
              className={plan.highlighted ? "text-porcelain/85" : "text-ink/80"}
            >
              {benefit}
            </span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant={plan.highlighted ? "primary" : "secondary"}
        className="mt-8 justify-center"
      >
        {plan.price === 0 ? "Get started" : "Subscribe"}
      </Button>
    </div>
  );
}
