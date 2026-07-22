"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { BookingStatusBadge } from "../../components/booking/BookingStatusBadge";
import { Container } from "../../components/layout/Container";
import type { BookingStatus } from "../../lib/types";

function isBookingStatus(value: string | null): value is BookingStatus {
  return (
    value === "submitted" ||
    value === "under_review" ||
    value === "contacted" ||
    value === "confirmed" ||
    value === "declined" ||
    value === "expired" ||
    value === "cancelled"
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const talent = searchParams.get("talent");

  if (!id) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          No booking to show
        </h1>
        <p className="mt-2 text-[14.5px] text-slate">
          Submit a request from the Quick Booking page to see a confirmation
          here.
        </p>
        <Link
          href="/quick-booking"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white hover:bg-brass"
        >
          Go to Quick Booking
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
        Booking Confirmation
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        Your request is with our team
      </h1>
      <p className="mt-3 text-[15px] text-slate">
        We&apos;ll call or email you within one business day to confirm details
        {talent ? ` for ${talent}` : ""}.
      </p>

      <div className="mt-8 rounded-lg border border-slate/20 bg-porcelain-soft/60 p-5">
        <dl className="flex flex-col gap-3 text-[14px]">
          <div className="flex items-center justify-between">
            <dt className="text-slate">Reference</dt>
            <dd className="font-mono text-ink">{id}</dd>
          </div>
          {talent ? (
            <div className="flex items-center justify-between">
              <dt className="text-slate">Talent</dt>
              <dd className="text-ink">{talent}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <dt className="text-slate">Status</dt>
            <dd>
              {isBookingStatus(status) ? (
                <BookingStatusBadge status={status} />
              ) : (
                "Submitted"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-slate/30 px-5 py-2.5 text-[14.5px] font-semibold text-ink hover:border-slate"
        >
          Back to home
        </Link>
        <Link
          href="/account"
          className="inline-flex items-center px-4 py-2.5 text-[14px] font-medium text-brass-deep hover:underline"
        >
          View my bookings →
        </Link>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Suspense fallback={null}>
        <ConfirmationContent />
      </Suspense>
    </Container>
  );
}
