import type { Metadata } from "next";

import { Container } from "../../components/layout/Container";
import { Faq } from "../../components/home/Faq";
import { MembershipCard } from "../../components/membership/MembershipCard";
import { getFaqs } from "../../lib/data/faqs";
import { getMembershipPlans } from "../../lib/data/memberships";

export const metadata: Metadata = {
  title: "Membership | MAYA_X",
  description:
    "Compare MAYA_X membership plans for priority booking review, member-only talent access, and preferential rates.",
};

export default async function MembershipPage() {
  const [plans, faqs] = await Promise.all([
    getMembershipPlans(),
    getFaqs("Membership"),
  ]);

  return (
    <>
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
            Membership
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Choose the level of priority your events need
          </h1>
          <p className="mt-3 text-[15.5px] text-slate">
            Every plan includes access to our full vetted talent catalog —
            membership changes how fast your requests are reviewed and what else
            is unlocked.
          </p>
        </div>

        <ul
          className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3"
          role="list"
        >
          {plans.map((plan) => (
            <li key={plan.id}>
              <MembershipCard plan={plan} />
            </li>
          ))}
        </ul>
      </Container>

      {faqs.length > 0 ? (
        <section
          aria-labelledby="membership-faq-heading"
          className="bg-porcelain-soft py-16"
        >
          <Container className="max-w-3xl">
            <h2
              id="membership-faq-heading"
              className="font-display text-2xl font-semibold text-ink"
            >
              Membership questions
            </h2>
            <div className="mt-6">
              <Faq items={faqs} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
