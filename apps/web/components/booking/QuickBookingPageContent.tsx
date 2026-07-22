"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { QuickBookingForm } from "./QuickBookingForm";
import {
  listBookableTalent,
  type PublicTalentOption,
} from "../../lib/data/bookings";

export function QuickBookingPageContent() {
  const router = useRouter();
  const [talentOptions, setTalentOptions] = useState<PublicTalentOption[]>([]);

  useEffect(() => {
    listBookableTalent()
      .then(setTalentOptions)
      .catch(() => setTalentOptions([]));
  }, []);

  return (
    <QuickBookingForm
      talentOptions={talentOptions.map((talent) => ({
        id: talent.id,
        displayName: talent.displayName,
      }))}
      onSuccess={(booking) => {
        const params = new URLSearchParams({
          id: booking.id,
          status: booking.status,
          talent: booking.talent.displayName,
        });
        router.push(`/booking-confirmation?${params.toString()}`);
      }}
    />
  );
}
