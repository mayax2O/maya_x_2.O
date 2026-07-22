"use client";

import { useEffect, useState } from "react";

import { getMembershipPlans } from "../../lib/data/memberships";
import type { MembershipPlan } from "../../lib/types";
import { MembershipCard } from "./MembershipCard";

/**
 * Client-side fetch (rather than the homepage's own server-side await, like
 * the other homepage sections use) so this section's real API call can't
 * fail the whole page's static generation at build time the way the other,
 * mock-data-backed sections don't need to worry about.
 */
export function MembershipTeaser() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    getMembershipPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  if (plans.length === 0) return null;

  return (
    <ul
      className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3"
      role="list"
    >
      {plans.map((plan) => (
        <li key={plan.id}>
          <MembershipCard plan={plan} />
        </li>
      ))}
    </ul>
  );
}
