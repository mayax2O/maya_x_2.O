import type { Metadata } from "next";

import { Container } from "../../components/layout/Container";
import { QuickBookingForm } from "../../components/booking/QuickBookingForm";
import { getTalents } from "../../lib/data/talents";

export const metadata: Metadata = {
  title: "Quick Booking | MAYA_X",
  description:
    "Submit a booking request and our team will recommend the right talent for your event.",
};

export default async function QuickBookingPage() {
  const talents = await getTalents();

  return (
    <Container className="flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-lg">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
          Quick Booking
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Tell us about your event
        </h1>
        <p className="mt-3 text-[15px] text-slate">
          Share the details below and our team will confirm availability, or
          recommend talent that fits your event, within one business day.
        </p>

        <div className="mt-8">
          <QuickBookingForm
            talentOptions={talents.map((talent) => ({
              id: talent.id,
              displayName: talent.displayName,
            }))}
          />
        </div>
      </div>
    </Container>
  );
}
