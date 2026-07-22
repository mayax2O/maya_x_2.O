"use client";

import { useEffect, useState } from "react";

import { listMyBookings } from "../../lib/data/bookings";
import { useAuth } from "../../lib/auth/AuthContext";
import type { BookingResponse } from "../../lib/types";
import { BookingStatusBadge } from "./BookingStatusBadge";

function formatDate(value: string | null): string {
  if (!value) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function BookingHistoryList() {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!accessToken) return;
    listMyBookings(accessToken)
      .then((result) => {
        setBookings(result.items);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [accessToken]);

  if (status === "loading") {
    return <p className="text-[14px] text-slate">Loading your bookings…</p>;
  }

  if (status === "error") {
    return (
      <p className="text-[14px] text-danger">
        We couldn&apos;t load your bookings. Please try again later.
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="text-[14px] text-slate">
        You haven&apos;t submitted any booking requests yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="rounded-lg border border-slate/20 p-4 text-[14px]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-ink">
              {booking.talent.displayName}
            </p>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-slate">
            Event date: {formatDate(booking.eventDate)}
          </p>
          {booking.eventDetails ? (
            <p className="mt-1 text-slate/80">{booking.eventDetails}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
