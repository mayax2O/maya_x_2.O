import { formatPrice } from "../../lib/format";
import type { MembershipPlan } from "../../lib/types";
import { SubscribeButton } from "./SubscribeButton";

const CYCLE_LABEL: Record<MembershipPlan["billingCycle"], string> = {
  monthly: "month",
  annual: "year",
  one_time: "one-time",
};

// Section: Membership plan card — the `highlighted` variant is a
// deliberate fixed-dark accent in every theme (matching Hero/Footer), so
// it uses literal hex values instead of the theme-aware ink/porcelain
// tokens; the regular variant stays theme-aware.
export function MembershipCard({ plan }: { plan: MembershipPlan }) {
  return (
    <div
      className={[
        "flex flex-col rounded-lg p-6",
        plan.highlighted
          ? "bg-[#12141c] text-[#f3f4f6] ring-2 ring-brass-deep"
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
        {plan.price > 0 && plan.billingCycle !== "one_time" ? (
          <span
            className={[
              "text-sm font-normal",
              plan.highlighted ? "text-[#f3f4f6]/60" : "text-slate",
            ].join(" ")}
          >
            {" "}
            / {CYCLE_LABEL[plan.billingCycle]}
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
              className={plan.highlighted ? "text-[#f3f4f6]/85" : "text-ink/80"}
            >
              {benefit}
            </span>
          </li>
        ))}
      </ul>

      <SubscribeButton
        plan={plan}
        variant={plan.highlighted ? "primary" : "secondary"}
      />
    </div>
  );
}
