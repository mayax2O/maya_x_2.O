"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { BookingStatusBadge } from "../../components/booking/BookingStatusBadge";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { listBookingRequests } from "../../lib/data/booking";
import type {
  BookingListFilters,
  BookingRequest,
  BookingStatus,
} from "../../lib/types";

const PER_PAGE = 20;

const STATUS_OPTIONS: BookingStatus[] = [
  "submitted",
  "under_review",
  "contacted",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
];

function formatDate(value: string | null): string {
  if (!value) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function BookingListContent() {
  const [rows, setRows] = useState<BookingRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookingListFilters>({});

  function load() {
    setLoading(true);
    setError(null);
    listBookingRequests({ ...filters, page, perPage: PER_PAGE })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load bookings.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [filters, page]);

  function updateFilter<K extends keyof BookingListFilters>(
    key: K,
    value: BookingListFilters[K],
  ) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const columns: DataTableColumn<BookingRequest>[] = [
    {
      key: "talent",
      header: "Talent",
      render: (row) => row.talent.displayName,
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <p>{row.customer.name}</p>
          <p className="text-porcelain/50">{row.customer.email}</p>
        </div>
      ),
    },
    {
      key: "eventDate",
      header: "Event date",
      render: (row) => formatDate(row.eventDate),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <BookingStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-porcelain">
          Bookings
        </h1>
        <p className="mt-1 text-[14px] text-porcelain/60">
          Review and action Guest and Member booking requests.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-white/10 bg-ink-soft p-4">
        <input
          value={filters.q ?? ""}
          onChange={(event) => updateFilter("q", event.target.value)}
          placeholder="Search by name, email, or talent..."
          aria-label="Search bookings"
          className="min-w-[240px] flex-1 rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        />
        <select
          value={filters.status ?? ""}
          onChange={(event) =>
            updateFilter(
              "status",
              (event.target.value || undefined) as BookingStatus | undefined,
            )
          }
          className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        page={page}
        perPage={PER_PAGE}
        total={total}
        onPageChange={setPage}
        selectable={false}
        rowHref={(row) => `/bookings/${row.id}`}
        emptyTitle="No booking requests found"
        emptyDescription="Try adjusting your search or filters."
      />
    </div>
  );
}

export default function BookingListPage() {
  return (
    <AdminShell>
      <BookingListContent />
    </AdminShell>
  );
}
