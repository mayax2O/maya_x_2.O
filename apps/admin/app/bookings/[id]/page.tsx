"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "../../../components/layout/AdminShell";
import { BookingStatusBadge } from "../../../components/booking/BookingStatusBadge";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { ApiError } from "../../../lib/api/client";
import {
  getBookingRequest,
  updateBookingStatus,
} from "../../../lib/data/booking";
import {
  BOOKING_STATUS_TRANSITIONS,
  type BookingRequest,
  type BookingStatus,
} from "../../../lib/types";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string | null): string {
  if (!value) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function BookingDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<BookingStatus | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    getBookingRequest(params.id)
      .then((result) => {
        setBooking(result);
        setNextStatus("");
        setNotes("");
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load booking.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  async function handleStatusSubmit() {
    if (!booking || !nextStatus) return;
    setSubmitting(true);
    try {
      const updated = await updateBookingStatus(
        booking.id,
        nextStatus,
        notes || undefined,
      );
      setBooking(updated);
      setNextStatus("");
      setNotes("");
      showToast("Booking status updated.", "success");
      load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to update status.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <ErrorState message={error ?? "Booking not found."} onRetry={load} />
    );
  }

  const allowedNext = BOOKING_STATUS_TRANSITIONS[booking.status];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Booking for {booking.talent.displayName}
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Submitted {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/bookings")}
          className="rounded-md border border-white/15 px-4 py-2 text-[13.5px] text-porcelain/80 hover:bg-white/5"
        >
          Back to Bookings
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-porcelain">
              Request details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-[13.5px]">
              <div>
                <dt className="text-porcelain/50">Status</dt>
                <dd className="mt-1">
                  <BookingStatusBadge status={booking.status} />
                </dd>
              </div>
              <div>
                <dt className="text-porcelain/50">Event date</dt>
                <dd className="mt-1 text-porcelain">
                  {formatDate(booking.eventDate)}
                </dd>
              </div>
              <div>
                <dt className="text-porcelain/50">Customer</dt>
                <dd className="mt-1 text-porcelain">
                  {booking.customer.name} ({booking.customer.type})
                </dd>
              </div>
              <div>
                <dt className="text-porcelain/50">Contact</dt>
                <dd className="mt-1 text-porcelain">
                  {booking.customer.email}
                  {booking.customer.phone ? ` · ${booking.customer.phone}` : ""}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-porcelain/50">Event details</dt>
                <dd className="mt-1 text-porcelain">
                  {booking.eventDetails ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-porcelain">
              Status history
            </h2>
            {booking.statusHistory && booking.statusHistory.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {booking.statusHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 text-[13.5px] last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-porcelain">
                        {entry.previousStatus
                          ? `${entry.previousStatus} → ${entry.newStatus}`
                          : `Submitted (${entry.newStatus})`}
                      </p>
                      {entry.notes ? (
                        <p className="mt-1 text-porcelain/60">{entry.notes}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-[12px] text-porcelain/40">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-porcelain/50">No history.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-porcelain">
            Update status
          </h2>
          {allowedNext.length === 0 ? (
            <p className="text-[13.5px] text-porcelain/50">
              This booking is in a final state and can&apos;t be transitioned
              further.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <select
                value={nextStatus}
                onChange={(event) =>
                  setNextStatus(event.target.value as BookingStatus | "")
                }
                className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
              >
                <option value="">Select next status…</option>
                {allowedNext.map((option) => (
                  <option key={option} value={option}>
                    {option.replace("_", " ")}
                  </option>
                ))}
              </select>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Notes (contact outcome, reason, etc.)"
                className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
              />
              <button
                type="button"
                disabled={!nextStatus || submitting}
                onClick={handleStatusSubmit}
                className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Updating…" : "Update status"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <AdminShell>
      <BookingDetailContent />
    </AdminShell>
  );
}
